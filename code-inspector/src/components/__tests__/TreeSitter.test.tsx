import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreeSitter from "@/pages/TreeSitter";

// Mock `TreeVisualizer` bileşeni
jest.mock("@/components/TreeVisualizer", () => {
    return () => (
      <div data-testid="tree-visualizer">Mock Tree Visualizer</div>
    );
});
  
  

// Mock `fetch` API
const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

describe("TreeSitter Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the component correctly", () => {
    render(<TreeSitter />);
    expect(screen.getByText("Code Analysis with TreeSitter")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your code here")).toBeInTheDocument();
    expect(screen.getByText("Analyze Code")).toBeInTheDocument();
  });

  test("shows error when the input is empty", async () => {
    render(<TreeSitter />);
    fireEvent.click(screen.getByText("Analyze Code"));
    expect(await screen.findByText("Code cannot be empty.")).toBeInTheDocument();
  });

  test("handles API success and displays tree data", async () => {
    const mockApiResponse = {
      nodes: [
        { id: 1, label: "Node 1" },
        { id: 2, label: "Node 2" },
      ],
    };
    (mockFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<TreeSitter />);

    const textarea = screen.getByPlaceholderText("Enter your code here");
    fireEvent.change(textarea, { target: { value: "sample code" } });

    fireEvent.click(screen.getByText("Analyze Code"));

    await waitFor(() =>
      expect(screen.getByTestId("tree-visualizer")).toBeInTheDocument()
    );
    expect(screen.getByText("Tree Visualizer")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/api/tree-sitter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "sample code" }),
    });
  });

  test("handles API failure and shows error", async () => {
    (mockFetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<TreeSitter />);

    const textarea = screen.getByPlaceholderText("Enter your code here");
    fireEvent.change(textarea, { target: { value: "sample code" } });

    fireEvent.click(screen.getByText("Analyze Code"));

    await waitFor(() =>
      expect(screen.getByText("An error occurred: HTTP error! Status: 500")).toBeInTheDocument()
    );
  });

  test("disables button while loading", async () => {
    const mockApiResponse = { nodes: [] };
    (mockFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<TreeSitter />);

    const textarea = screen.getByPlaceholderText("Enter your code here");
    fireEvent.change(textarea, { target: { value: "sample code" } });

    const button = screen.getByText("Analyze Code");
    fireEvent.click(button);

    expect(button).toBeDisabled();
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
