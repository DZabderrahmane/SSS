import os
import sys
import networkx as nx
import matplotlib.pyplot as plt

def load_relations(file_path):
    """
    Load relations from a text file.
    Each line should be in the format: source -> flux -> target
    """
    relations = []
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split(" -> ")
                if len(parts) == 3:
                    relations.append(tuple(parts))
    return relations

def save_relations(file_path, relations):
    """
    Save a list of relations to a text file.
    """
    with open(file_path, "w", encoding="utf-8") as f:
        for rel in relations:
            f.write(" -> ".join(rel) + "\n")

def merge_relations(baseline, working):
    """
    Merge baseline and working relations, avoiding duplicates.
    """
    merged = baseline.copy()
    for rel in working:
        if rel not in merged:
            merged.append(rel)
    return merged

def draw_graph(relations, output_image):
    """
    Draw and save the scenario graph.
    """
    nodes = set()
    for source, flux, target in relations:
        nodes.add(source)
        nodes.add(target)
    if not nodes:
        print("No data to draw.")
        return
    G = nx.DiGraph()
    G.add_nodes_from(nodes)
    for source, target, flux in relations:
        G.add_edge(source, target, label=flux)
    pos = nx.kamada_kawai_layout(G)
    plt.figure(figsize=(10, 8), dpi=300)
    nx.draw(G, pos, with_labels=True, node_color="lightblue", edge_color="gray",
            node_size=3000, font_size=12, font_weight="bold", arrows=True, arrowsize=20)
    edge_labels = nx.get_edge_attributes(G, "label")
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color="red",
                                  font_size=12, font_weight="bold")
    plt.axis("off")
    plt.savefig(output_image, bbox_inches="tight")
    plt.close()
    print("Scenario diagram updated successfully.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python Modify_Scenario.py <db_path>")
        sys.exit(1)
    
    db_path = sys.argv[1]
    working_file = os.path.join(db_path, "scenario_data.txt")
    title_file = os.path.join(db_path, "scenario_title.txt")
    
    if not os.path.exists(title_file):
        print("Scenario title file not found. Cannot load baseline.")
        sys.exit(1)
    
    with open(title_file, "r", encoding="utf-8") as f:
        scenario_title = f.read().strip()
    
    # The baseline snapshot file is named as [scenarioTitle].txt
    baseline_file = os.path.join(db_path, scenario_title & ".txt")
    output_image = os.path.join(db_path, "ScenarioDiagram.png")
    
    # Load relations from both files
    baseline = load_relations(baseline_file)
    working = load_relations(working_file)
    
    merged = merge_relations(baseline, working)
    save_relations(working_file, merged)
    draw_graph(merged, output_image)
    
    print("Scenario modified successfully.")
