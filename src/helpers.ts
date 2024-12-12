export const formatToolCall = (obj: any, isError: boolean = false) => {
    return {
        content: [{ type: "text", text: JSON.stringify(obj, null, 2), isError }],
    };
}