import { chromium } from 'playwright';

const launchBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });

  const page = await browser.newPage();
  // await page.goto('file:///Users/lakshyasaharan/projects/stagehand-lite/examples/company-site/index.html');
  await page.goto('https://ultimateqa.com/');
  // await page.goto('https://google.com/');
  // await page.locator('//html[1]/body[1]/c-wiz[2]/div[1]/div[2]/c-wiz[1]/div[1]/c-wiz[1]/div[2]/div[2]/div[1]/section[5]/div[1]/div[1]/div[1]/div[1]/div[1]/span[1]/div[1]/button[1]').click();
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('Accessibility.enable');
  const { root } = await client.send("DOM.getDocument", {
    depth: -1,
    pierce: true,
  });

  printDOM;

  const xpathMap = buildXpathMap(root);
  console.log(xpathMap.get(2132));

  const { nodes } = await client.send("Accessibility.getFullAXTree");
  const axTree = buildAXTree(nodes);

  printAXTree(axTree);

  const pruned = pruneAXTree(axTree);

  printCleanTree(pruned);

  await browser.close();
};

launchBrowser();

function pruneAXTree(nodes: any[]): any[] {
  const cleaned: any[] = [];

  const structuralRoles = new Set([
    "generic",
    "none",
    "InlineTextBox",
  ]);

  for (const node of nodes) {
    let role = node.role?.value || "";
    let name = (node.name?.value || "").trim();

    // Recursively prune children first
    let children = pruneAXTree(node.children || []);

    // Skip ignored nodes completely
    if (node.ignored) {
      cleaned.push(...children);
      continue;
    }

    // Drop decorative images
    if (role === "image" && !name) {
      continue;
    }

    // Remove redundant static text children
    children = removeRedundantStaticTextChildren(name, children);

    // Structural role handling
    if (structuralRoles.has(role)) {
      if (children.length === 1) {
        cleaned.push(children[0]);
      } else if (children.length > 1) {
        cleaned.push(...children);
      }
      continue;
    }

    // Keep everything else (no whitelist!)
    cleaned.push({
      role,
      name,
      backendDOMNodeId: node.backendDOMNodeId,
      children,
    });
  }

  return cleaned;
}

function removeRedundantStaticTextChildren(parentName: string, children: any[]) {
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


function printCleanTree(nodes: any[], depth = 0) {
  const indent = "  ".repeat(depth);

  for (const node of nodes) {
    console.log(
      `${indent}${node.role}${node.name ? ` "${node.name}"` : ""}`
    );

    if (node.children?.length) {
      printCleanTree(node.children, depth + 1);
    }
  }
}


function buildAXTree(nodes: any[]) {
  const nodeMap = new Map<string, any>();
  const roots: any[] = [];

  // First pass: store nodes
  for (const node of nodes) {
    node.children = [];
    nodeMap.set(node.nodeId, node);
  }

  // Second pass: link parent-child
  for (const node of nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function printAXTree(nodes: any[], depth = 0) {
  const indent = "  ".repeat(depth);

  for (const node of nodes) {
    const role = node.role?.value || "unknown";
    const name = node.name?.value || "";

    console.log(
      `${indent}${role}${name ? ` "${name}"` : ""} (backendId: ${node.backendDOMNodeId || "-"})`
    );

    if (node.children?.length) {
      printAXTree(node.children, depth + 1);
    }
  }
}

function printDOM(node: any, depth = 0) {
  const indent = "  ".repeat(depth);

  const name = node.nodeName;
  const id = node.backendNodeId;

  console.log(`${indent}${name} (${id})`);

  if (!node.children) return;

  for (const child of node.children) {
    printDOM(child, depth + 1);
  }
}

function buildXpathMap(domRoot: any) {
  const xpathMap = new Map<number, string>();

  // Find real <html> root (skip #document)
  const htmlNode = domRoot.children?.find(
    (child: any) =>
      child.nodeType === 1 &&
      child.nodeName.toLowerCase() === "html"
  );

  if (!htmlNode) {
    throw new Error("HTML root not found");
  }

  // Start traversal from real html
  traverse(htmlNode, "/html[1]");

  function traverse(node: any, currentPath: string) {
    if (node.backendNodeId) {
      xpathMap.set(node.backendNodeId, currentPath);
    }

    if (!node.children) return;

    // Only count ELEMENT siblings
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
