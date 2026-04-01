import unittest

from password_checker import PasswordEvaluator


class PasswordEvaluatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.evaluator = PasswordEvaluator()

    def test_common_password_is_very_weak(self) -> None:
        result = self.evaluator.evaluate("password")
        self.assertTrue(result.checks["is_common_password"])
        self.assertEqual(result.rating, "Very Weak")
        self.assertLess(result.score, 20)

    def test_long_passphrase_scores_high(self) -> None:
        result = self.evaluator.evaluate("river-harbor-lantern-galaxy-4821")
        self.assertGreaterEqual(result.score, 75)
        self.assertIn(result.rating, {"Strong", "Very Strong"})

    def test_sequence_is_detected(self) -> None:
        result = self.evaluator.evaluate("MyPass1234")
        self.assertTrue(result.checks["contains_sequence"])

    def test_keyboard_walk_is_detected(self) -> None:
        result = self.evaluator.evaluate("safeQwerty77!")
        self.assertTrue(result.checks["contains_keyboard_walk"])

    def test_leetspeak_word_is_detected(self) -> None:
        result = self.evaluator.evaluate("P@55w0rd2026")
        self.assertTrue(result.checks["contains_leetspeak_word"])

    def test_repetition_is_detected(self) -> None:
        result = self.evaluator.evaluate("abcabcabcXYZ")
        self.assertTrue(result.checks["contains_repetition"])

    def test_generated_high_entropy_password_scores_high(self) -> None:
        result = self.evaluator.evaluate("3&L6CTxiM47wts")
        self.assertGreaterEqual(result.score, 80)
        self.assertIn(result.rating, {"Strong", "Very Strong"})


if __name__ == "__main__":
    unittest.main()
