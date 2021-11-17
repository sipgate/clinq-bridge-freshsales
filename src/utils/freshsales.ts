import axios from "axios";

export async function getAllContactsViewID(apiKey: string, apiUrl: string) {
    const allFilters = await axios.get(apiUrl + "/contacts/filters/",
        {
            headers: {"Authorization": `Token token=${apiKey}`},
        });
    const allContactsFilter = allFilters.data.filters.filter((entry: any) => entry.name === 'All Contacts')
    if (!allContactsFilter || allContactsFilter.length !== 1) {
        throw new Error("Could not identify 'All Contacts' filter")
    }
    return allContactsFilter[0].id
}

export async function getAllContacts(apiKey: string, apiUrl: string, viewID: number) {
    let allContacts: Array<object> = []
    const allContactsResponse = await axios.get(apiUrl + `/contacts/view/${viewID}`,
        {
            headers: {"Authorization": `Token token=${apiKey}`},
            params: {"include": "sales_accounts"}
        });
    allContacts = allContacts.concat(allContactsResponse.data.contacts)
    let page: number = 2;
    while (page <= allContactsResponse.data.meta.total_pages) {
        const allContactsPageResponse = await axios.get(apiUrl + `/contacts/view/${viewID}`,
            {
                headers: {"Authorization": `Token token=${apiKey}`},
                params: {'page': page, "include": "sales_accounts"}
            });
        allContacts = allContacts.concat(allContactsPageResponse.data.contacts)
        page +=1;
    }
    if (allContacts.length !== allContactsResponse.data.meta.total) {
        throw new Error(`Expected result size ${allContactsResponse.data.meta.total} but got ${allContacts.length}`)
    }
    return allContacts
}
