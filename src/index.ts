import { preCheck } from "./precheck";
import { startAgent } from "./agent";

async function main() {

    const userQuery = "Go to google and search for flights"; // later from CLI
    console.log("User Query: ", userQuery);

    // pre check
    const isValid = await preCheck(userQuery);

    if (!isValid) {
        console.log("Out of scope query");
        return;
    }

    // agent loop
    const agentResponse = await startAgent(userQuery);
    console.log("Agent Response: ", agentResponse);

    // finish
    console.log("Finished");
}

main();