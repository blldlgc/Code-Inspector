# Code Inspector

<div align="center">
  <img src="code-inspector/public/logo.png" alt="Code Inspector Logo" width="200"/>
  <br>
  <p><strong>A Modern Code Analysis and Quality Inspection Tool</strong></p>
</div>

## 🌟 Overview

Code Inspector is a sophisticated code analysis tool designed to help developers maintain high-quality code standards. It combines frontend visualization with powerful backend analysis to provide comprehensive insights into your codebase.

## 🚀 Features

- **Code Quality Analysis**: Automated inspection of code quality using PMD
- **Duplicate Code Detection**: Identifies code duplications and suggests improvements
- **AST Visualization**: Interactive visualization of Abstract Syntax Trees
- **Real-time Analysis**: Instant feedback on code quality
- **Multiple Language Support**: Currently supports Java with extensibility for other languages
- **Modern UI**: Built with React and Tailwind CSS for a seamless user experience

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Flow for graph representations

### Backend
- Java 21
- Spring Boot 3
- PMD for code analysis
- Tree-sitter Java
- JUnit for testing
- Maven

## 🏗️ Architecture

The project follows a modern client-server architecture:
- **Frontend**: Single Page Application (SPA) built with React
- **Backend**: RESTful API built with Spring Boot
- **Analysis Engine**: Combines PMD and custom analysis tools

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Java 21
- Maven

### Frontend Setup
```bash
cd code-inspector
npm install
npm run dev
```

### Backend Setup
```bash
cd CodeInspectorBackend
mvn clean install
mvn spring-boot:run
```

## 🧪 Testing

### Frontend Tests
```bash
cd code-inspector
npm test
```

### Backend Tests
```bash
cd CodeInspectorBackend
mvn test
```

## 📈 Quality Metrics

The project uses several tools to maintain code quality:
- SonarQube for continuous code quality
- PMD for Java code analysis

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- Developed by the Code Inspector Team
- Maintained by [@Blldlgc](https://github.com/blldlgc) (Bilal Dalgıç) & [@Btlsn](https://github.com/Btlsn)  (Betül Şen)

## 📞 Contact

For any queries or support, please open an issue in the repository.

---

<div align="center">
  Made with ❤️ by Code Inspector Team
</div> 