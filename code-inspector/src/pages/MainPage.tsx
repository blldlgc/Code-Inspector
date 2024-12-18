import BlurIn from "@/components/ui/blur-in";
import TypingAnimation from "@/components/ui/typing-animation";

const MainPage = () => {
    

    return (
        <div className= "flex flex-col items-center justify-center ">
            <BlurIn
            word="Code Inspector"
            className="text-4xl font-bold text-black dark:text-white"
            duration={0.5}
            />
            <TypingAnimation
            className="text-2xl font-thin text-black dark:text-white"
            duration={8}
            text="Welcome to Code Inspector!

Code Inspector is an innovative tool designed to enhance your coding workflow and ensure the quality and security of your code. Whether you are an individual developer or part of a team, Code Inspector provides a comprehensive suite of features to help you maintain clean, efficient, and secure codebases.

Key Features:
Code Similarity Detection: Identify and quantify the similarity between different code snippets, helping you detect duplicate or similar code easily.
Graphical Code Representation: Visualize your code as graphs to better understand the structure and relationships within your codebase.
Code Metrics Generation: Automatically generate at least 10 different metrics from your code to evaluate its complexity, maintainability, and quality.
Code Smell Detection: Use a rule-based database or third-party libraries to detect code smells and improve your code's health.
Code Security and Error Prediction: Enhance the security of your code and predict potential errors before they occur.
Code Coverage Calculation: Calculate the coverage rate of your code by integrating with your project's test suite, providing insights into the thoroughness of your tests.
Code Inspector aims to revolutionize the way you manage and analyze your code, making it easier to detect issues, improve code quality, and ensure robust security practices.

Join the growing community of developers who trust Code Inspector to streamline their development process and boost productivity."
            />
            

            <div className= "flex flex-col items-center justify-center ">
                
            </div>

            
        </div>
    );
}

export default MainPage;
