from __future__ import annotations

from dataclasses import dataclass
from math import log2
import re
from typing import Dict, List


COMMON_PASSWORDS = {
    "password",
    "password1",
    "123456",
    "12345678",
    "123456789",
    "qwerty",
    "abc123",
    "letmein",
    "admin",
    "welcome",
    "iloveyou",
    "monkey",
    "dragon",
    "football",
    "baseball",
    "trustno1",
    "sunshine",
    "princess",
    "passw0rd",
}

COMMON_WORDS = {
    "about",
    "account",
    "admin",
    "apple",
    "autumn",
    "baseball",
    "basketball",
    "cat",
    "change",
    "college",
    "computer",
    "cookie",
    "dragon",
    "football",
    "freedom",
    "friend",
    "hello",
    "house",
    "iloveyou",
    "jordan",
    "letmein",
    "login",
    "master",
    "michael",
    "monkey",
    "pass",
    "password",
    "princess",
    "qwerty",
    "root",
    "secret",
    "shadow",
    "soccer",
    "star",
    "summer",
    "superman",
    "test",
    "welcome",
    "winter",
}

KEYBOARD_ROWS = [
    "1234567890",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
]

LEET_MAP = str.maketrans(
    {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
        "!": "i",
    }
)


@dataclass(frozen=True)
class PasswordPolicy:
    min_length: int = 12


@dataclass(frozen=True)
class PasswordAnalysis:
    score: int
    rating: str
    entropy_bits: float
    findings: List[str]
    advice: List[str]
    checks: Dict[str, bool]


class PasswordEvaluator:
    def __init__(self, policy: PasswordPolicy | None = None) -> None:
        self.policy = policy or PasswordPolicy()

    def evaluate(self, password: str) -> PasswordAnalysis:
        password = password or ""
        lowered = password.lower()
        leet_normalized = lowered.translate(LEET_MAP)

        checks = {
            "meets_min_length": len(password) >= self.policy.min_length,
            "is_common_password": lowered in COMMON_PASSWORDS,
            "contains_dictionary_word": self._contains_dictionary_word(lowered),
            "contains_sequence": self._has_sequence(lowered),
            "contains_keyboard_walk": self._has_keyboard_walk(lowered),
            "contains_repetition": self._has_repetition(lowered),
            "contains_leetspeak_word": self._contains_dictionary_word(leet_normalized) and leet_normalized != lowered,
        }

        entropy_bits = self._estimate_entropy_bits(password)
        score = self._score(password, entropy_bits, checks)
        rating = self._rating(score, checks)
        findings = self._build_findings(checks, entropy_bits)
        advice = self._build_advice(password, checks)

        return PasswordAnalysis(
            score=score,
            rating=rating,
            entropy_bits=round(entropy_bits, 2),
            findings=findings,
            advice=advice,
            checks=checks,
        )

    def _estimate_entropy_bits(self, password: str) -> float:
        if not password:
            return 0.0

        pool_size = 0
        if any(c.islower() for c in password):
            pool_size += 26
        if any(c.isupper() for c in password):
            pool_size += 26
        if any(c.isdigit() for c in password):
            pool_size += 10
        if any(not c.isalnum() for c in password):
            pool_size += 33

        if pool_size <= 1:
            return float(len(password))
        return len(password) * log2(pool_size)

    def _score(self, password: str, entropy_bits: float, checks: Dict[str, bool]) -> int:
        length = len(password)

        if length >= 20:
            length_points = 38
        elif length >= 16:
            length_points = 34
        elif length >= 14:
            length_points = 32
        elif length >= 12:
            length_points = 26
        elif length >= 8:
            length_points = 14
        else:
            length_points = 5

        entropy_points = min(entropy_bits, 90) / 90 * 40

        char_categories = sum(
            [
                any(c.islower() for c in password),
                any(c.isupper() for c in password),
                any(c.isdigit() for c in password),
                any(not c.isalnum() for c in password),
            ]
        )
        diversity_points = char_categories / 4 * 12

        pattern_flags = [
            checks["contains_dictionary_word"],
            checks["contains_sequence"],
            checks["contains_keyboard_walk"],
            checks["contains_repetition"],
            checks["contains_leetspeak_word"],
        ]
        clean_pattern_bonus = 8 if password and not any(pattern_flags) else 0

        penalty = 0
        if not checks["meets_min_length"]:
            penalty += 20
        if checks["is_common_password"]:
            penalty += 60
        if checks["contains_dictionary_word"]:
            penalty += 20
        if checks["contains_sequence"]:
            penalty += 10
        if checks["contains_keyboard_walk"]:
            penalty += 15
        if checks["contains_repetition"]:
            penalty += 10
        if checks["contains_leetspeak_word"]:
            penalty += 10

        raw = length_points + entropy_points + diversity_points + clean_pattern_bonus - penalty
        return max(0, min(100, round(raw)))

    def _rating(self, score: int, checks: Dict[str, bool]) -> str:
        if checks["is_common_password"] or score < 20:
            return "Very Weak"
        if score < 40:
            return "Weak"
        if score < 60:
            return "Fair"
        if score < 80:
            return "Strong"
        return "Very Strong"

    def _build_findings(self, checks: Dict[str, bool], entropy_bits: float) -> List[str]:
        findings: List[str] = [f"Estimated entropy: {entropy_bits:.2f} bits"]

        if checks["is_common_password"]:
            findings.append("Matches a known common password")
        if checks["contains_dictionary_word"]:
            findings.append("Contains common dictionary words")
        if checks["contains_sequence"]:
            findings.append("Contains sequential characters")
        if checks["contains_keyboard_walk"]:
            findings.append("Contains keyboard walk patterns")
        if checks["contains_repetition"]:
            findings.append("Contains repeated characters or blocks")
        if checks["contains_leetspeak_word"]:
            findings.append("Uses leetspeak substitutions of common words")

        return findings

    def _build_advice(self, password: str, checks: Dict[str, bool]) -> List[str]:
        advice: List[str] = []

        if len(password) < self.policy.min_length:
            remaining = self.policy.min_length - len(password)
            advice.append(f"Add at least {remaining} more characters")

        if checks["is_common_password"]:
            advice.append("Choose a completely different password, this one is highly guessable")
        if checks["contains_dictionary_word"]:
            advice.append("Avoid common words; use an uncommon passphrase with random words")
        if checks["contains_sequence"]:
            advice.append("Remove sequences like 1234 or abcd")
        if checks["contains_keyboard_walk"]:
            advice.append("Avoid keyboard patterns like qwerty or asdf")
        if checks["contains_repetition"]:
            advice.append("Avoid repeated characters and repeated chunks")
        if checks["contains_leetspeak_word"]:
            advice.append("Leetspeak substitutions are predictable; use truly random changes")

        if not advice:
            advice.append("Good job. Keep this password unique and do not reuse it across sites")

        return advice

    def _contains_dictionary_word(self, text: str) -> bool:
        # Check raw tokenized words.
        tokens = re.findall(r"[a-z]{3,}", text)
        if any(token in COMMON_WORDS for token in tokens):
            return True

        # Also check if common words appear as substrings in long passwords.
        return any(word in text for word in COMMON_WORDS if len(word) >= 4)

    def _has_sequence(self, text: str, run_len: int = 4) -> bool:
        if len(text) < run_len:
            return False

        # Detect ascending and descending ascii runs in letters and digits.
        for i in range(len(text) - run_len + 1):
            window = text[i : i + run_len]
            if all(window[j + 1] == chr(ord(window[j]) + 1) for j in range(run_len - 1)):
                return True
            if all(window[j + 1] == chr(ord(window[j]) - 1) for j in range(run_len - 1)):
                return True
        return False

    def _has_keyboard_walk(self, text: str, run_len: int = 4) -> bool:
        lowered = text.lower()
        for row in KEYBOARD_ROWS:
            rev = row[::-1]
            for i in range(len(row) - run_len + 1):
                seq = row[i : i + run_len]
                rev_seq = rev[i : i + run_len]
                if seq in lowered or rev_seq in lowered:
                    return True
        return False

    def _has_repetition(self, text: str) -> bool:
        if re.search(r"(.)\1{2,}", text):
            return True
        if re.search(r"(.{2,4})\1{1,}", text):
            return True
        return False
