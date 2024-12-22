export const exampleCodes = {
  comparison: {
    code1: `public class FibonacciCalculator {
    public static void main(String[] args) {
        int n = 10;
        System.out.println("Fibonacci Series:");
        for (int i = 0; i < n; i++) {
            System.out.println("Fibonacci(" + i + ") = " + fibonacci(i));
        }
    }

    public static int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
`,
    code2: `public class FibonacciCalculator {
    public static void main(String[] args) {
        int n = 10;
        System.out.println("Fibonacci Series:");
        for (int i = 0; i < n; i++) {
            System.out.println("Fibonacci(" + i + ") = " + fibonacci(i));
        }

        System.out.println("Factorial Values:");
        for (int i = 1; i <= n; i++) {
            System.out.println("Factorial(" + i + ") = " + factorial(i));
        }
    }

    public static int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static int factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }
}
`
  },
  metrics: `// This is a sample Java code for testing
        public class SampleClass {

        // Variable declarations
        private int count;
        private String name;

        // Constructor
        public SampleClass(String name) {
            this.name = name;
            this.count = 0;
        }

        // A sample method
        public void increment() {
            // Increment the count
            count++;
        }

        // Another method with loops and conditions
        public void analyze(int[] numbers) {
            for (int num : numbers) {
                if (num % 2 == 0) {
                    System.out.println("Even number: " + num);
                } else {
                    System.out.println("Odd number: " + num);
                }
            }
        }

        // Method calling another method
        public void process() {
            increment(); 
        }
    }`,
  coverage: {
    appCode: `public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int subtract(int a, int b) {
        return a - b;
    }
    
    public int multiply(int a, int b) {
        return a * b;
    }
}`,
    testCode: `import org.junit.Test;
import static org.junit.Assert.*;

public class CalculatorTest {
    private Calculator calc = new Calculator();
    
    @Test
    public void testAdd() {
        assertEquals(4, calc.add(2, 2));
    }
    
    @Test
    public void testSubtract() {
        assertEquals(2, calc.subtract(4, 2));
    }
}`
  }
}; 