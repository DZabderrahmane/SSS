import os
import networkx as nx
import matplotlib.pyplot as plt

def load_scenario_data(data_file):
    """
    Load existing nodes and relationships from the scenario data file.
    Each valid line must be in the format:
         source -> flux -> target
    Returns a set of nodes and a list of edges.
    """
    nodes = set()
    edges = []
    
    if not os.path.exists(data_file):
        print(f"Data file '{data_file}' not found.")
        return nodes, edges

    with open(data_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue  # Skip empty lines
            parts = line.split(" -> ")
            if len(parts) == 3:
                source, flux, target = parts
                nodes.add(source)
                nodes.add(target)
                edges.append((source, target, flux))
            else:
                print(f"Skipping invalid line: {line}")
    
    print("Loaded nodes:", nodes)
    print("Loaded edges:", edges)
    return nodes, edges

def draw_scenario_graph(nodes, edges, output_image):
    """
    Draws and saves the scenario graph using a clear layout.
    """
    if not nodes:
        print("No nodes to draw. The image will be blank.")
        # Create an empty white image as a fallback
        plt.figure(figsize=(10, 8), dpi=300)
        plt.axis("off")
        plt.savefig(output_image, bbox_inches="tight")
        plt.close()
        return

    G = nx.DiGraph()
    G.add_nodes_from(nodes)
    for source, target, flux in edges:
        G.add_edge(source, target, label=flux)
    
    # Use Kamada-Kawai layout for good spacing
    pos = nx.kamada_kawai_layout(G)
    plt.figure(figsize=(10, 8), dpi=300)
    
    # Draw nodes and edges with labels
    nx.draw(G, pos, with_labels=True, node_color="lightblue", edge_color="gray",
            node_size=3000, font_size=12, font_weight="bold", arrows=True, arrowsize=20)
    
    edge_labels = nx.get_edge_attributes(G, "label")
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color="red",
                                  font_size=12, font_weight="bold")
    
    plt.axis("off")
    plt.savefig(output_image, bbox_inches="tight")
    plt.close()
    print(f"Scenario diagram saved as: {output_image}")

if __name__ == "__main__":
    # Assume this script is in the same folder as the Access database.
    db_path = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(db_path, "scenario_data.txt")
    output_image = os.path.join(db_path, "ScenarioDiagram.png")
    
    nodes, edges = load_scenario_data(data_file)
    draw_scenario_graph(nodes, edges, output_image)
