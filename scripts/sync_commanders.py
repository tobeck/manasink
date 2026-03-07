#!/usr/bin/env python3
"""
Sync all commander-eligible cards from Scryfall bulk data into Supabase.

Requirements: pip install requests supabase
Environment:  SUPABASE_URL, SUPABASE_SECRET_KEY

Downloads Scryfall's oracle_cards bulk data (~162MB), filters to
commander-eligible legendary creatures (~3K cards), and upserts
them into the `commanders` table in batches.
"""

import os
import sys
import json
from datetime import datetime, timezone

import requests
from supabase import create_client

SCRYFALL_BULK_API = "https://api.scryfall.com/bulk-data"
BATCH_SIZE = 500


def get_env_or_exit(key):
    value = os.environ.get(key)
    if not value:
        print(f"Error: {key} environment variable is required", file=sys.stderr)
        sys.exit(1)
    return value


def fetch_bulk_data_url():
    """Get the oracle_cards download URL from Scryfall bulk data manifest."""
    print("Fetching Scryfall bulk data manifest...")
    resp = requests.get(SCRYFALL_BULK_API)
    resp.raise_for_status()
    manifest = resp.json()

    for item in manifest["data"]:
        if item["type"] == "oracle_cards":
            print(f"Found oracle_cards: {item['updated_at']}")
            return item["download_uri"]

    print("Error: oracle_cards not found in bulk data manifest", file=sys.stderr)
    sys.exit(1)


def download_cards(url):
    """Download and parse the full oracle cards JSON."""
    print(f"Downloading oracle cards from {url}...")
    resp = requests.get(url)
    resp.raise_for_status()
    cards = resp.json()
    print(f"Downloaded {len(cards)} total cards")
    return cards


def is_commander_eligible(card):
    """Check if a card can be used as a commander."""
    # Must be legal in commander
    legalities = card.get("legalities", {})
    if legalities.get("commander") != "legal":
        return False

    # Must be available in paper
    games = card.get("games", [])
    if "paper" not in games:
        return False

    type_line = card.get("type_line", "")
    oracle_text = card.get("oracle_text", "")

    # Check card faces for double-faced cards
    card_faces = card.get("card_faces", [])
    if card_faces:
        type_line = card_faces[0].get("type_line", type_line)
        oracle_text = " // ".join(
            face.get("oracle_text", "") for face in card_faces
        )

    # Legendary Creature or "can be your commander"
    is_legendary_creature = (
        "Legendary" in type_line and "Creature" in type_line
    )
    can_be_commander = "can be your commander" in oracle_text.lower()

    return is_legendary_creature or can_be_commander


def map_card_to_row(card):
    """Map a Scryfall card object to the commanders table schema."""
    # Handle double-faced cards: use card_faces[0] for images if no top-level image_uris
    image_uris = card.get("image_uris") or {}
    card_faces = card.get("card_faces", [])
    if not image_uris and card_faces:
        image_uris = card_faces[0].get("image_uris", {})

    # Oracle text: join faces with separator for DFCs
    oracle_text = card.get("oracle_text", "")
    if not oracle_text and card_faces:
        oracle_text = " // ".join(
            face.get("oracle_text", "") for face in card_faces
        )

    # Prices
    prices = card.get("prices", {})
    price_usd = None
    price_eur = None
    if prices.get("usd"):
        try:
            price_usd = float(prices["usd"])
        except (ValueError, TypeError):
            pass
    if prices.get("eur"):
        try:
            price_eur = float(prices["eur"])
        except (ValueError, TypeError):
            pass

    return {
        "scryfall_id": card["id"],
        "name": card["name"],
        "color_identity": card.get("color_identity", []),
        "cmc": card.get("cmc"),
        "mana_cost": card.get("mana_cost") or (card_faces[0].get("mana_cost") if card_faces else None),
        "type_line": card.get("type_line", ""),
        "oracle_text": oracle_text,
        "keywords": card.get("keywords", []),
        "power": card.get("power") or (card_faces[0].get("power") if card_faces else None),
        "toughness": card.get("toughness") or (card_faces[0].get("toughness") if card_faces else None),
        "edhrec_rank": card.get("edhrec_rank"),
        "price_usd": price_usd,
        "price_eur": price_eur,
        "image_small": image_uris.get("small"),
        "image_large": image_uris.get("large") or image_uris.get("normal"),
        "scryfall_uri": card.get("scryfall_uri"),
        "set_code": card.get("set"),
        "rarity": card.get("rarity"),
        "released_at": card.get("released_at"),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


def main():
    supabase_url = get_env_or_exit("SUPABASE_URL")
    service_role_key = get_env_or_exit("SUPABASE_SECRET_KEY")

    # Create Supabase client with service role key (bypasses RLS)
    supabase = create_client(supabase_url, service_role_key)

    # Fetch and download bulk data
    bulk_url = fetch_bulk_data_url()
    all_cards = download_cards(bulk_url)

    # Filter to commander-eligible cards
    commanders = [card for card in all_cards if is_commander_eligible(card)]
    print(f"Found {len(commanders)} commander-eligible cards")

    # Map to table schema
    rows = [map_card_to_row(card) for card in commanders]

    # Upsert in batches
    total = len(rows)
    upserted = 0
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        supabase.table("commanders").upsert(batch).execute()
        upserted += len(batch)
        print(f"Upserted {upserted}/{total} commanders...")

    print(f"Done! {total} commanders synced to Supabase.")


if __name__ == "__main__":
    main()
