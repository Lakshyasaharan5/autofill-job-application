import { chromium } from 'playwright';

const launchBrowser = async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });

  const page = await browser.newPage();
  await page.goto('https://ultimateqa.com/');
  await page.locator('//html[1]/body[1]/div[1]/div[1]/header[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/nav[1]/ul[1]/li[2]').click();
  const client = await page.context().newCDPSession(page);
  // await client.send('Accessibility.enable'); 
  const { root } = await client.send("DOM.getDocument", {
    depth: -1,
    pierce: true,
  });

  printDOM(root);

  const xpathMap = buildXpathMap(root);

  console.log(xpathMap.get(16));


  await browser.close();
};

launchBrowser();

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
