#!/usr/bin/env python3
"""Remplace, EN PLACE, l'icone du stub 7zSD.sfx par le logo Sparkle.

Sûr : les 2 emplacements RT_ICON du stub font exactement 744 et 296 octets,
soit une icone 32x32 et 16x16 en 16 couleurs (4bpp). On n'ajoute aucune
section, on ne change aucun offset/RVA : seule la donnée pixel + les metadata
du RT_GROUP_ICON sont réécrites. La structure PE reste identique.
"""
import struct, sys
from PIL import Image
import pefile

LOGO = sys.argv[1] if len(sys.argv) > 1 else "resources/payload/../../brand-logo.png"
STUB = sys.argv[2] if len(sys.argv) > 2 else "7zSD.sfx"


def build_dib_4bpp(logo_path, size):
    """Construit une image DIB d'icone 4bpp (XOR + AND) pour la taille donnée."""
    img = Image.open(logo_path).convert("RGBA").resize((size, size), Image.LANCZOS)
    px = img.load()

    # Masque de transparence (1 = transparent)
    transparent = [[px[x, y][3] < 128 for x in range(size)] for y in range(size)]

    # Quantification RGB -> 16 couleurs
    rgb = img.convert("RGB")
    pal_img = rgb.quantize(colors=16, method=Image.MEDIANCUT)
    idx = pal_img.load()
    pal = pal_img.getpalette()[: 16 * 3]
    while len(pal) < 16 * 3:
        pal += [0, 0, 0]

    # BITMAPINFOHEADER (biHeight = 2*size : XOR + AND)
    header = struct.pack("<IiiHHIIiiII", 40, size, size * 2, 1, 4, 0, 0, 0, 0, 16, 0)

    # Palette RGBQUAD (B,G,R,0)
    palette = b"".join(struct.pack("<BBBB", pal[i * 3 + 2], pal[i * 3 + 1], pal[i * 3], 0) for i in range(16))

    # XOR bitmap 4bpp, bottom-up, lignes alignées sur 4 octets
    xor_row = ((size * 4 + 31) // 32) * 4  # octets par ligne
    xor = bytearray()
    for y in range(size - 1, -1, -1):
        row = bytearray(xor_row)
        for x in range(size):
            v = 0 if transparent[y][x] else (idx[x, y] & 0x0F)
            if x % 2 == 0:
                row[x // 2] = (v << 4) | (row[x // 2] & 0x0F)
            else:
                row[x // 2] = (row[x // 2] & 0xF0) | v
        xor += row

    # AND mask 1bpp, bottom-up, lignes alignées sur 4 octets (1 = transparent)
    and_row = ((size + 31) // 32) * 4
    andm = bytearray()
    for y in range(size - 1, -1, -1):
        row = bytearray(and_row)
        for x in range(size):
            if transparent[y][x]:
                row[x // 8] |= (0x80 >> (x % 8))
        andm += row

    dib = header + palette + bytes(xor) + bytes(andm)
    return dib


def main():
    pe = pefile.PE(STUB)
    RT_ICON, RT_GROUP_ICON = 3, 14
    icons = {}   # id -> (rva, size)
    group = None  # (rva, size)
    for res in pe.DIRECTORY_ENTRY_RESOURCE.entries:
        if res.struct.Id == RT_ICON:
            for e in res.directory.entries:
                for l in e.directory.entries:
                    icons[e.struct.Id] = (l.data.struct.OffsetToData, l.data.struct.Size)
        elif res.struct.Id == RT_GROUP_ICON:
            for e in res.directory.entries:
                for l in e.directory.entries:
                    group = (l.data.struct.OffsetToData, l.data.struct.Size)

    # id1 -> 744 (32x32), id2 -> 296 (16x16)
    size_by_id = {}
    for _id, (_rva, sz) in icons.items():
        size_by_id[_id] = 32 if sz >= 744 else 16

    data = bytearray(pe.__data__)

    entries = []  # pour le group icon
    for _id, (rva, slot) in sorted(icons.items()):
        s = size_by_id[_id]
        dib = build_dib_4bpp(LOGO, s)
        assert len(dib) <= slot, f"icone {s}px = {len(dib)}o > slot {slot}o"
        off = pe.get_offset_from_rva(rva)
        data[off:off + len(dib)] = dib
        # padding restant : zéros (ignoré grâce à bytesInRes)
        for i in range(off + len(dib), off + slot):
            data[i] = 0
        entries.append((s, len(dib), _id))

    # RT_GROUP_ICON : GRPICONDIR + GRPICONDIRENTRY*n
    g_off = pe.get_offset_from_rva(group[0])
    grp = struct.pack("<HHH", 0, 1, len(entries))
    for (s, nbytes, _id) in entries:
        grp += struct.pack("<BBBBHHIH", s & 0xFF, s & 0xFF, 16, 0, 1, 4, nbytes, _id)
    assert len(grp) <= group[1], f"group {len(grp)} > {group[1]}"
    data[g_off:g_off + len(grp)] = grp

    pe.close()
    with open(STUB, "wb") as f:
        f.write(data)
    print("OK icone posee sur", STUB, "| entries:", entries)


if __name__ == "__main__":
    main()
