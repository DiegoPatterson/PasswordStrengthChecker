from password_checker import PasswordEvaluator


def main() -> None:
    evaluator = PasswordEvaluator()

    print("Password Strength Checker (NIST-inspired)")
    print("Type a password to evaluate. Press Ctrl+C to exit.\n")

    while True:
        try:
            password = input("Password: ")
        except KeyboardInterrupt:
            print("\nBye.")
            break

        result = evaluator.evaluate(password)
        print(f"Score: {result.score}/100")
        print(f"Rating: {result.rating}")
        print(f"Entropy: {result.entropy_bits} bits")

        print("Findings:")
        for item in result.findings:
            print(f"- {item}")

        print("Advice:")
        for item in result.advice:
            print(f"- {item}")
        print()


if __name__ == "__main__":
    main()
