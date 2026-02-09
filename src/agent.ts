export async function startAgent(userQuery: string): Promise<string> {
    console.log("Agent started for ", userQuery);

    // loop
    let steps = 3;
    let done = false;
    while (steps > 0 && !done) {
        //observe
        console.log("Observing HTML...");
        await sleep(1000);

        //act
        console.log("Acting...")
        await sleep(1000);

        steps--;
    }

    return "Agent task completed";
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}