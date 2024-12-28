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
  },
  testGenerator: {
    sourceCode: `public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int subtract(int a, int b) {
        return a - b;
    }

    public int multiply(int a, int b) {
        return a * b;
    }

    public int divide(int a, int b) {
        if (b == 0) {
            throw new IllegalArgumentException("Division by zero is not allowed.");
        }
        return a / b;
    }
}`
  },
  codeSmells: `public class WorseCodeSmellExample {
    // 1) Class has multiple fields (Field Bloat).
    // 2) Bazı alanlar gereksiz veya anlamlandırılmamış.
    // 3) Poor naming conventions: a, x, y, z, count, flag

    public String a;
    private int x;
    private static double y;
    protected boolean z;
    public String count;
    private static int flag;

    public WorseCodeSmellExample() {
        a = "default";
        x = 0;
        y = 0.0;
        z = false;
        count = "none";
        flag = 1;
    }

    // 4) Long Parameter List + Data Clumps (8 parametre)!
    public void doCrazyStuff(
            String arg1,
            String arg2,
            String arg3,
            int num1,
            int num2,
            int num3,
            double rate,
            boolean isActive
    ) {
        // Duplicate Code + Magic Numbers + Kötü isimlendirme

        System.out.println("Starting doCrazyStuff... " + a);

        // Bir sürü if-else --> Cyclomatic Complexity artışı
        if (arg1 == null) {
            System.out.println("arg1 is null!");
        } else if (arg1.length() == 0) {
            System.out.println("arg1 is empty!");
        } else if (arg1.equals("abc")) {
            System.out.println("arg1 is 'abc'!");
        } else {
            System.out.println("arg1: " + arg1);
        }

        if (arg2 == null) {
            System.out.println("arg2 is null!");
        } else if (arg2.isEmpty()) {
            System.out.println("arg2 is empty!");
        }

        // Switch-case ekleyip karmaşıklığı artırıyoruz
        switch (num1) {
            case 0:
                System.out.println("num1: 0");
                break;
            case 5:
                System.out.println("num1: 5");
                break;
            default:
                System.out.println("num1 is " + num1);
                break;
        }

        // Gereksiz if-else / duplication
        if (num2 > 10) {
            if (num3 < 5) {
                System.out.println("num2>10 && num3<5");
            } else if (num3 == 5) {
                System.out.println("num2>10 && num3==5");
            } else {
                System.out.println("num2>10 && num3>5");
            }
        } else {
            System.out.println("num2 <= 10");
        }

        // Kötü isimlendirilmiş static değişkeni değiştirme
        if (isActive) {
            flag++;
        } else {
            flag--;
        }

        // Çakma "iş yapıyor" gibi gözüken tekrarlı kod
        for (int i = 0; i < 2; i++) {
            if (arg3 != null && !arg3.isEmpty()) {
                System.out.println("arg3 loop: " + arg3);
            } else {
                System.out.println("arg3 is not valid in loop");
            }
        }

        // Magic Number
        if (rate > 3.14) {
            System.out.println("Rate is more than Pi!");
        }

        System.out.println("Finished doCrazyStuff...");
    }

    // 5) İkinci büyük method -> yine uzun parametre listesi, duplication, vb.
    public void doAnotherInsaneThing(
            String p1,
            String p2,
            String p3,
            String p4,
            int val1,
            double val2,
            double val3,
            boolean check
    ) {
        System.out.println("Starting doAnotherInsaneThing... " + x);

        // Gereksiz if-else / switch-case tekrarları
        if (p1 != null && p1.equals("spam")) {
            System.out.println("p1 is spam");
        } else if (p1 != null && p1.equals("eggs")) {
            System.out.println("p1 is eggs");
        } else {
            System.out.println("p1 is something else");
        }

        switch (val1) {
            case 100:
                System.out.println("val1 = 100");
                break;
            case 999:
                System.out.println("val1 = 999");
                break;
            default:
                System.out.println("val1 = " + val1);
                break;
        }

        // Biraz daha duplication
        if (check) {
            flag += 10;
        } else {
            flag -= 5;
        }

        // Boş loop --> code smell
        for (int i = 0; i < 3; i++) {
            if (p2 != null && !p2.isEmpty()) {
                System.out.println("p2: " + p2);
            }
        }

        // Data Clumps: Çok parametre, tekrarlayan mantık
        if (p3 != null && p4 != null) {
            System.out.println("p3 + p4: " + p3 + ", " + p4);
        } else {
            System.out.println("p3 veya p4 null olabilir.");
        }

        // Magic numbers
        if (val2 + val3 > 42.0) {
            System.out.println("val2 + val3 > 42!");
        }

        System.out.println("Finished doAnotherInsaneThing...");
    }
}`,
codesecurity: `public class Test {
    private String password = "123456";
    public void login(String username, String password) {
        Statement stmt = connection.createStatement();
        String query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
        stmt.executeQuery(query);
    }
    public void processData(String data) {
        if(data != null) {
            System.out.println(data);
        }
    }
}`,
codeGraph: `// This is a sample Java code for testing
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
}; 