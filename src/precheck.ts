export async function preCheck(userQuery: string): Promise<boolean> {
    console.log("Pre check for ", userQuery);
    return true;
}