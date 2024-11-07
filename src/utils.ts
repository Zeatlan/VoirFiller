function getChildData(
    element: cheerio.TagElement,
    childIndexes: number[]
): string {
    let currentElement: cheerio.TagElement = element;

    for (const index of childIndexes) {
        currentElement = currentElement.children[index] as cheerio.TagElement;
        if (!currentElement) return "";
    }

    return currentElement.data || "";
}

export default getChildData;
