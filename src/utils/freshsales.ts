import axios from "axios";
import {errorLogger, infoLogger} from "./logger";
import {CallDirection, CallEvent} from "@clinq/bridge";
import {normalizePhoneNumber, parsePhoneNumber} from "./phone-numbers";
import {ContactTemplate} from "@clinq/bridge/dist/models";

export async function getAllContactsViewID(apiKey: string, apiUrl: string) {
    infoLogger(apiKey, `Fetching filters. Looking for 'All Contacts' filter`);
    const allFilters = await axios.get(apiUrl + "/contacts/filters/",
        {
            headers: {"Authorization": `Token token=${apiKey}`},
        });
    const allContactsFilter = allFilters.data.filters.filter((entry: any) => entry.name === 'All Contacts')
    if (!allContactsFilter || allContactsFilter.length !== 1) {
        errorLogger(apiKey, "Could not identify 'All Contacts' filter, needed for fetching all contacts.")
        throw new Error("Could not identify 'All Contacts' filter")
    }
    return allContactsFilter[0].id
}

export async function getAllContacts(apiKey: string, apiUrl: string, viewID: number) {
    let allContacts: Array<object> = []
    infoLogger(apiKey, `Fetching all contacts`);
    let page: number = 1;
    const searchContacts = (pageValue: number) => axios.get(apiUrl + `/contacts/view/${viewID}`,
        {
            headers: {"Authorization": `Token token=${apiKey}`},
            params: {'page': pageValue.toString(), "include": "sales_accounts"}
        });
    const allContactsResponse = await searchContacts(page);
    allContacts = allContacts.concat(allContactsResponse.data.contacts)
    infoLogger(apiKey, `Fetching all contacts: found ${allContactsResponse.data.meta.total} contacts 
    on ${allContactsResponse.data.meta.total_pages} pages`);
    while (page <= allContactsResponse.data.meta.total_pages) {
        page += 1;
        infoLogger(apiKey, `Fetching page ${page} page from ${allContactsResponse.data.meta.total_pages}`);
        const allContactsPageResponse = await searchContacts(page);
        allContacts = allContacts.concat(allContactsPageResponse.data.contacts)
    }
    if (allContacts.length !== allContactsResponse.data.meta.total) {
        throw new Error(`Expected result size ${allContactsResponse.data.meta.total} but got ${allContacts.length}`)
    }
    infoLogger(apiKey, `Fetched ${allContacts.length} contacts`);
    return allContacts
}

export async function searchContactByPhonenumber(apiKey: string, apiUrl: string, event: CallEvent,
                                                 freshsale_number_type: string, phoneNumber: string) {
    const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
    const searchCall = (searchValue: string) =>
        axios.get(apiUrl + `/lookup?q=${searchValue}&f=${freshsale_number_type}&entities=contact`,
            {
                headers: {"Authorization": `Token token=${apiKey}`},
            });
    const originalResponse = searchCall(phoneNumber)
    const mobileNumberE164Response = searchCall(parsedPhoneNumber.e164)
    const mobileNumberE164NormalizedResponse = searchCall(normalizePhoneNumber(parsedPhoneNumber.e164))
    const mobileNumberLocalizedResponse = searchCall(parsedPhoneNumber.localized)
    const mobileNumberNormalizedLocalizedResponse = searchCall(normalizePhoneNumber(parsedPhoneNumber.localized))
    const results = await Promise.all(
        [
            originalResponse,
            mobileNumberE164Response,
            mobileNumberE164NormalizedResponse,
            mobileNumberLocalizedResponse,
            mobileNumberNormalizedLocalizedResponse,
        ].map((promise) => promise.catch(() => ({data: {results: []}})))
    );
    const result = results
        .map(({data: {contacts: {contacts}}}) => contacts)
        .filter((contacts) => Array.isArray(contacts) && contacts.length > 0)
        .find(Boolean);
    if (!result) {
        return;
    }
    infoLogger(apiKey, `Found contact for phone number:`, phoneNumber);
    return result[0];
}

export async function createCallLog(apiKey: string, apiUrl: string, event: CallEvent, contactId: number, comment: string) {
    const payload = {'call_direction': event.direction === CallDirection.IN, "targetable_type": "contact",
        "targetable": {"id": contactId.toString()}, "note": { "description": comment}}
    const commentResponse = await axios.post(apiUrl + `/phone_calls`, payload,
        {headers: {"Authorization": `Token token=${apiKey}`},});
    return commentResponse
}

export async function createFreshsaleContact(apiKey: string, apiUrl: string, contact: {}) {
    const response = await axios.post(apiUrl + `/contacts`, contact,
        {headers: {"Authorization": `Token token=${apiKey}`},});
    return response.data.contact;
}
export async function createSalesAccount(apiKey: string, apiUrl: string, salesAccountName: string) {
    const payload = {'sales_account': {'name': salesAccountName}}
    const response = await axios.post(apiUrl + `/sales_accounts`, payload,
        {headers: {"Authorization": `Token token=${apiKey}`},});
    return response.data.sales_account.id;
}

export async function updateFreshsaleContact(apiKey: string, apiUrl: string, contact: {}, id: string) {
    const response = await axios.put(apiUrl + `/contacts/${id}`, contact,
        {headers: {"Authorization": `Token token=${apiKey}`},});
    return response.data.contact;
}

export async function forgetFreshsaleContact(apiKey: string, apiUrl: string, id: string) {
    const response = await axios.delete(apiUrl + `/contacts/${id}/forget`,
        {headers: {"Authorization": `Token token=${apiKey}`},});
    return response.data;
}

export async function searchSalesAccountId(apiKey: string, apiUrl: string, organizationName: string) {
    const searchResponse = await axios.get(apiUrl + `/lookup?q=${organizationName}&f=name&entities=sales_account`,
            {
                headers: {"Authorization": `Token token=${apiKey}`},
            });
    return searchResponse.data.sales_accounts.sales_accounts.length?searchResponse.data.sales_accounts.sales_accounts[0].id:null;
}
