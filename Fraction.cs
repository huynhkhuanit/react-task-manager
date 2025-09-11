using System;

namespace FractionLibrary
{
    public class Fraction
    {
        private int numerator;
        private int denominator;

        // Properties with validation
        public int Numerator
        {
            get { return numerator; }
            set {
                numerator = value;
                Simplify();
            }
        }

        public int Denominator
        {
            get { return denominator; }
            set {
                if (value == 0) throw new ArgumentException("Denominator cannot be zero.");
                denominator = value;
                Simplify();
            }
        }

        // Constructors
        public Fraction(int numerator, int denominator)
        {
            if (denominator == 0) throw new ArgumentException("Denominator cannot be zero.");
            this.numerator = numerator;
            this.denominator = denominator;
            Simplify();
        }

        public Fraction(int wholeNumber)
        {
            this.numerator = wholeNumber;
            this.denominator = 1;
        }

        // Arithmetic operations
        public static Fraction operator +(Fraction a, Fraction b)
        {
            return new Fraction(a.Numerator * b.Denominator + b.Numerator * a.Denominator, a.Denominator * b.Denominator);
        }

        public static Fraction operator -(Fraction a, Fraction b)
        {
            return new Fraction(a.Numerator * b.Denominator - b.Numerator * a.Denominator, a.Denominator * b.Denominator);
        }

        public static Fraction operator *(Fraction a, Fraction b)
        {
            return new Fraction(a.Numerator * b.Numerator, a.Denominator * b.Denominator);
        }

        public static Fraction operator /(Fraction a, Fraction b)
        {
            if (b.Numerator == 0) throw new DivideByZeroException("Cannot divide by a fraction with a numerator of zero.");
            return new Fraction(a.Numerator * b.Denominator, a.Denominator * b.Numerator);
        }

        // Simplify the fraction
        private void Simplify()
        {
            int gcd = GCD(Math.Abs(numerator), Math.Abs(denominator));
            numerator /= gcd;
            denominator /= gcd;
            if (denominator < 0) // Keep denominator positive
            {
                numerator = -numerator;
                denominator = -denominator;
            }
        }

        // Calculate GCD
        private int GCD(int a, int b)
        {
            while (b != 0)
            {
                int temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        }

        public override string ToString()
        {
            return denominator == 1 ? numerator.ToString() : numerator + "/" + denominator;
        }
    }
}