import hashlib
from django.contrib.auth.hashers import BasePasswordHasher


class LegacySHA256Hasher(BasePasswordHasher):
    """
    Custom password hasher that matches the Express backend's hashing:
        SHA-256(password + 'edutrack_salt_2026')

    Stored format in DB:  legacy_sha256$$<hex_digest>
    """
    algorithm = 'legacy_sha256'

    def salt(self):
        return ''  # salt is hardcoded in the hash

    def encode(self, password, salt=''):
        digest = hashlib.sha256((password + 'edutrack_salt_2026').encode()).hexdigest()
        return f'legacy_sha256$${digest}'

    def verify(self, password, encoded):
        # Handle raw hex hashes imported directly from database.json
        if not encoded.startswith('legacy_sha256$$'):
            # It's a raw hex digest from the old Express DB
            digest = hashlib.sha256((password + 'edutrack_salt_2026').encode()).hexdigest()
            return digest == encoded
        # Standard format
        _, _, stored_hash = encoded.partition('$$')
        digest = hashlib.sha256((password + 'edutrack_salt_2026').encode()).hexdigest()
        return digest == stored_hash

    def safe_summary(self, encoded):
        if encoded.startswith('legacy_sha256$$'):
            _, _, h = encoded.partition('$$')
        else:
            h = encoded
        return {'algorithm': self.algorithm, 'hash': f'{h[:6]}...'}

    def must_update(self, encoded):
        # Encourage migration to PBKDF2 on next login
        return True
