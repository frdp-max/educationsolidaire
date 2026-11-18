#!/usr/bin/env python3
"""Installe le certificat Let's Encrypt à l'endroit que lit Nginx.

Nginx ne lit jamais /etc/letsencrypt/live/ (dont le nom de lignée peut changer :
education-solidaire.org, education-solidaire.org-0001…) mais un chemin fixe :
    /etc/letsencrypt/unisson/fullchain.pem et privkey.pem

Deux usages :
- hook certbot (--deploy-hook) : certbot fournit RENEWED_LINEAGE, on copie cette lignée ;
- appel direct (deploy.sh) : on choisit, parmi les lignées de live/ couvrant le domaine,
  le certificat Let's Encrypt qui expire le plus tard, et on le copie s'il est plus
  récent que celui déjà installé.

Copie atomique (fichier temporaire puis rename) : Nginx ne lit jamais un fichier à moitié écrit.
Sortie 0 si un certificat valide est en place, 1 sinon.
"""
import glob
import os
import sys
from datetime import datetime, timezone

from cryptography import x509

DOMAIN = os.environ.get("UNISSON_DOMAIN", "education-solidaire.org")
LE_DIR = os.environ.get("UNISSON_LE_DIR", "/etc/letsencrypt")
DEST = os.path.join(LE_DIR, "unisson")


def load(path):
    try:
        with open(path, "rb") as fh:
            return x509.load_pem_x509_certificate(fh.read())
    except (OSError, ValueError):
        return None


def not_after(cert):
    value = getattr(cert, "not_valid_after_utc", None)
    return value if value is not None else cert.not_valid_after.replace(tzinfo=timezone.utc)


def is_lets_encrypt(cert):
    return "Let's Encrypt" in cert.issuer.rfc4514_string()


def covers_domain(cert):
    try:
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
    except x509.ExtensionNotFound:
        return False
    return DOMAIN in san.value.get_values_for_type(x509.DNSName)


def best_lineage():
    best, best_end = None, None
    for lineage in sorted(glob.glob(os.path.join(LE_DIR, "live", DOMAIN + "*"))):
        cert = load(os.path.join(lineage, "fullchain.pem"))
        if not cert or not is_lets_encrypt(cert) or not covers_domain(cert):
            continue
        if not os.path.isfile(os.path.join(lineage, "privkey.pem")):
            continue
        if best_end is None or not_after(cert) > best_end:
            best, best_end = lineage, not_after(cert)
    return best


def copy_atomic(src, dst, mode):
    with open(src, "rb") as fh:  # open() suit les liens symboliques de live/
        data = fh.read()
    tmp = dst + ".tmp"
    with open(tmp, "wb") as fh:
        fh.write(data)
    os.chmod(tmp, mode)
    os.replace(tmp, dst)


def main():
    source = os.environ.get("RENEWED_LINEAGE") or best_lineage()
    installed = load(os.path.join(DEST, "fullchain.pem"))

    if source:
        candidate = load(os.path.join(source, "fullchain.pem"))
        if candidate and (
            installed is None
            or not is_lets_encrypt(installed)
            or not_after(candidate) > not_after(installed)
        ):
            os.makedirs(DEST, exist_ok=True)
            copy_atomic(os.path.join(source, "privkey.pem"), os.path.join(DEST, "privkey.pem"), 0o600)
            copy_atomic(os.path.join(source, "fullchain.pem"), os.path.join(DEST, "fullchain.pem"), 0o644)
            installed = candidate
            print(f"Certificat installé depuis {source} (expire le {not_after(candidate):%Y-%m-%d})")

    if installed is None or not is_lets_encrypt(installed):
        print("Aucun certificat Let's Encrypt installé dans " + DEST, file=sys.stderr)
        return 1
    if not_after(installed) <= datetime.now(timezone.utc):
        print(f"Certificat installé EXPIRÉ ({not_after(installed):%Y-%m-%d})", file=sys.stderr)
        return 1
    print(f"Certificat en place : expire le {not_after(installed):%Y-%m-%d}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
