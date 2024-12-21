import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Code2, Shield, BarChart, TestTube2, GitCompare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: "Code Clone Detection",
            description: "Detect duplicate code blocks in your project and improve code quality",
            icon: <GitCompare className="w-6 h-6" />,
            path: "/code-comparison"
        },
        {
            title: "Code Metrics",
            description: "Measure your code quality and identify areas for improvement",
            icon: <Code2 className="w-6 h-6" />,
            path: "/metrics"
        },
        {
            title: "Security Analysis",
            description: "Detect security vulnerabilities early and take preventive measures",
            icon: <Shield className="w-6 h-6" />,
            path: "/security"
        },
        {
            title: "Visual Analysis",
            description: "Visualize your code with graphs for better understanding",
            icon: <BarChart className="w-6 h-6" />,
            path: "/codegraph"
        },
        {
            title: "Code Coverage",
            description: "Track and analyze your code's test coverage metrics",
            icon: <TestTube2 className="w-6 h-6" />,
            path: "/coverage"
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 relative"
            >
                <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-0 translate-x-2"
                >
                    v1.0.0 Beta
                </Badge>
                <h1 className="text-5xl font-bold mb-6 tracking-tight md:text-5xl text-4xl">
                    Code Inspector
                </h1>
                <h2 className="text-4xl font-bold mb-4 tracking-tight md:text-4xl text-3xl">
                    Analyze Your Code, Enhance Quality
                </h2>
                <p className="text-lg text-muted-foreground mb-8 px-4">
                    Use Code Inspector to analyze your code, detect security vulnerabilities, and improve code quality
                </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        onClick={() => navigate(feature.path)}
                        className="cursor-pointer"
                    >
                        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:bg-accent">
                            <div className="mb-4 text-primary">
                                {feature.icon}
                            </div>
                            <h3 className="font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MainPage;
