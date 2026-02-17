export type AXNodeLite = {
  nodeId: string;
  parentId?: string;
  role: string;
  name: string;
  backendDOMNodeId?: number;
  ignored?: boolean;
  children: AXNodeLite[];
};

export type AgentAction =
  | { type: "click"; backendId: number }
  | { type: "type"; backendId: number; text: string }
  | { type: "wait" }
  | { type: "done" };

export type LLMContext = {
  userQuery: string;
  tree: string;
};

