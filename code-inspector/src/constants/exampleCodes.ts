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
    codeSmells: `public class ExampleClass {
      private int a1, a2, a3, a4, a5, a6, a7, a8; // Fazla alan tanımı
      private String name, surname, email, phone, address; // Data clump örneği
      private double salary, bonus, taxRate, netSalary, totalDeductions; // Data clump örneği
  
      public void doStuff(int x, int y, int z, int w) { // Uzun parametre listesi
          if (x > 10) {
              for (int i = 0; i < 10; i++) {
                  if (y > 5) {
                      if (z > 0) {
                          if (w > 5) {
                              System.out.println("All conditions met!");
                          } else if (w == 5) {
                              System.out.println("W is exactly 5");
                          } else {
                              System.out.println("W is less than 5");
                          }
                      } else {
                          System.out.println("Z is non-positive");
                      }
                  } else {
                      while (x > 0) {
                          x--;
                          if (x % 2 == 0) {
                              if (x > 5) {
                                  System.out.println("Even and greater than 5: " + x);
                              } else {
                                  System.out.println("Even but not greater than 5: " + x);
                              }
                          } else {
                              System.out.println("Odd: " + x);
                          }
                      }
                  }
              }
          } else if (y < 0) {
              if (z > 10) {
                  if (w < 3) {
                      System.out.println("Z is large and W is small");
                  } else {
                      System.out.println("Z is large but W is not small");
                  }
              } else if (z == 0) {
                  System.out.println("Z is zero");
              } else {
                  System.out.println("Z is small");
              }
          } else {
              if (w > 50) {
                  System.out.println("W is very large");
              } else if (w > 20) {
                  System.out.println("W is moderately large");
              } else {
                  System.out.println("W is small");
              }
              int someCounter = 0;
              do {
                  someCounter++;
                  if (someCounter % 3 == 0) {
                      System.out.println("Counter divisible by 3: " + someCounter);
                  } else if (someCounter % 5 == 0) {
                      System.out.println("Counter divisible by 5: " + someCounter);
                  } else {
                      System.out.println("Counter: " + someCounter);
                  }
              } while (someCounter < 10);
          }
      }
  
      public void processEmployee(String name, String surname, String email, String phone, String address,
                                  double salary, double bonus, double taxRate, double netSalary, double totalDeductions) {
          // Çok fazla ilişkisiz parametre (data clump)
          System.out.println("Processing employee data:");
          System.out.println("Name: " + name);
          System.out.println("Surname: " + surname);
          System.out.println("Email: " + email);
          System.out.println("Phone: " + phone);
          System.out.println("Address: " + address);
          System.out.println("Salary: " + salary);
          System.out.println("Bonus: " + bonus);
          System.out.println("Tax Rate: " + taxRate);
          System.out.println("Net Salary: " + netSalary);
          System.out.println("Total Deductions: " + totalDeductions);
      }
  
      private void abc() { // Kötü isimlendirme
          int zz = 5; // Kötü isimlendirme
          String cc = "test"; // Kötü isimlendirme
          for (int i = 0; i < zz; i++) {
              if (i == 0) {
                  System.out.println(cc + " - First");
              } else if (i == zz - 1) {
                  System.out.println(cc + " - Last");
              } else {
                  System.out.println(cc + " - Middle");
              }
          }
      }
  
      private void duplicatedCode() {
          if (true) {
              System.out.println("This is duplicate code");
              System.out.println("This is duplicate code");
              System.out.println("This is duplicate code");
              System.out.println("This is duplicate code");
          } else {
              System.out.println("This is still duplicate code");
              System.out.println("This is still duplicate code");
          }
      }
  
      public static void main(String[] args) {
          ExampleClass obj = new ExampleClass();
          obj.doStuff(15, -5, 2, 7); // Uzun parametre listesi
          obj.processEmployee("John", "Doe", "john.doe@example.com", "1234567890", "123 Street", 50000, 5000, 0.2, 45000, 5000); // Data clump
          obj.abc(); // Kötü isimlendirme
          obj.duplicatedCode(); // Kopya kod
      }
  }
  `,
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