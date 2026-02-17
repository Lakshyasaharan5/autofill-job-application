import { chromium } from "playwright";

/* ============================
   Internal Clean AX Node Type
============================ */

type AXNodeLite = {
  nodeId: string;
  parentId?: string;
  role: string;
  name: string;
  backendDOMNodeId?: number;
  ignored?: boolean;
  children: AXNodeLite[];
};

/* ============================
   Launch
============================ */

const launchBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });

  const page = await browser.newPage();
  // await page.goto("https://ultimateqa.com/");
  // await page.goto("https://google.com/");
  await page.goto("file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html");

  const client = await page.context().newCDPSession(page);

  await client.send("DOM.enable");
  await client.send("Accessibility.enable");

  const { root } = await client.send("DOM.getDocument", {
    depth: -1,
    pierce: true,
  });

  // Optional: inspect DOM
  printDOM;

  const xpathMap = buildXpathMap(root);
  console.log("Sample XPath:", xpathMap.values().next().value);

  const { nodes } = await client.send("Accessibility.getFullAXTree");

  /* ============================
     NORMALIZE → BUILD → PRINT
  ============================ */

  const normalized = normalizeAXNodes(nodes);
  const axTree = buildAXTree(normalized);

  console.log("\n==== RAW AX TREE ====\n");
  printTree(axTree);

  const pruned = pruneAXTree(axTree);

  console.log("\n==== PRUNED TREE ====\n");
  printTree(pruned);

  await browser.close();
};

launchBrowser();

/* ============================
   Normalize CDP → Internal
============================ */

function normalizeAXNodes(rawNodes: any[]): AXNodeLite[] {
  return rawNodes.map((node) => ({
    nodeId: node.nodeId,
    parentId: node.parentId,
    role: node.role?.value || "",
    name: (node.name?.value || "").trim(),
    backendDOMNodeId: node.backendDOMNodeId,
    ignored: node.ignored || false,
    children: [],
  }));
}

/* ============================
   Build Hierarchical Tree
============================ */

function buildAXTree(nodes: AXNodeLite[]): AXNodeLite[] {
  const nodeMap = new Map<string, AXNodeLite>();
  const roots: AXNodeLite[] = [];

  for (const node of nodes) {
    nodeMap.set(node.nodeId, node);
  }

  for (const node of nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/* ============================
   Prune Logic (Stagehand-style)
============================ */

function pruneAXTree(nodes: AXNodeLite[]): AXNodeLite[] {
  const cleaned: AXNodeLite[] = [];

  const structuralRoles = new Set([
    "generic",
    "none",
    "InlineTextBox",
  ]);

  for (const node of nodes) {
    let { role, name, backendDOMNodeId, ignored } = node;

    let children = pruneAXTree(node.children);

    if (ignored) {
      cleaned.push(...children);
      continue;
    }

    // Drop decorative images
    if (role === "image" && !name) continue;

    // Remove redundant static text children
    children = removeRedundantStaticTextChildren(name, children);

    // Structural collapse
    if (structuralRoles.has(role)) {
      if (children.length === 1) cleaned.push(children[0]);
      else cleaned.push(...children);
      continue;
    }

    cleaned.push({
      nodeId: node.nodeId,
      role,
      name,
      backendDOMNodeId: backendDOMNodeId ?? 0,
      children,
    });
  }

  return cleaned;
}

/* ============================
   Remove duplicate static text
============================ */

function removeRedundantStaticTextChildren(
  parentName: string,
  children: AXNodeLite[]
): AXNodeLite[] {
  if (!parentName) return children;

  const normalizedParent = normalizeSpaces(parentName);

  let combined = "";
  for (const child of children) {
    if (child.role === "StaticText" && child.name) {
      combined += normalizeSpaces(child.name);
    }
  }

  if (normalizeSpaces(combined) === normalizedParent) {
    return children.filter((c) => c.role !== "StaticText");
  }

  return children;
}

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/* ============================
   Universal Print Function
============================ */

function printTree(nodes: AXNodeLite[], depth = 0) {
  const indent = "  ".repeat(depth);

  for (const node of nodes) {
    console.log(
      `${indent}${node.role}${
        node.name ? ` "${node.name}"` : ""
      } (backendId: ${node.backendDOMNodeId ?? "-"})`
    );

    if (node.children.length) {
      printTree(node.children, depth + 1);
    }
  }
}

/* ============================
   DOM Printer (Optional)
============================ */

function printDOM(node: any, depth = 0) {
  const indent = "  ".repeat(depth);
  console.log(`${indent}${node.nodeName} (${node.backendNodeId})`);

  if (!node.children) return;

  for (const child of node.children) {
    printDOM(child, depth + 1);
  }
}

/* ============================
   XPath Map Builder
============================ */

function buildXpathMap(domRoot: any) {
  const xpathMap = new Map<number, string>();

  const htmlNode = domRoot.children?.find(
    (child: any) =>
      child.nodeType === 1 &&
      child.nodeName.toLowerCase() === "html"
  );

  if (!htmlNode) throw new Error("HTML root not found");

  traverse(htmlNode, "/html[1]");

  function traverse(node: any, currentPath: string) {
    if (node.backendNodeId) {
      xpathMap.set(node.backendNodeId, currentPath);
    }

    if (!node.children) return;

    const elementChildren = node.children.filter(
      (child: any) => child.nodeType === 1
    );

    const tagCounter: Record<string, number> = {};

    for (const child of elementChildren) {
      const tag = child.nodeName.toLowerCase();
      tagCounter[tag] = (tagCounter[tag] || 0) + 1;
      const index = tagCounter[tag];
      const childPath = `${currentPath}/${tag}[${index}]`;
      traverse(child, childPath);
    }
  }

  return xpathMap;
}
