import {Adapter, CallDirection, CallEvent, Config, Contact, ServerError, start} from "@clinq/bridge";
import {
    createCallLog,
    createFreshsaleContact, createSalesAccount, forgetFreshsaleContact,
    getAllContacts,
    getAllContactsViewID,
    searchContactByPhonenumber, searchSalesAccountId, updateFreshsaleContact
} from './utils/freshsales'
import {
    mapClinqContactTemplate2FreshsaleContact,
    mapEvent2Comment,
    mapFreshsalesContact2ClinqContact
} from "./utils/mapper";
import {errorLogger, infoLogger, warnLogger} from "./utils/logger";
import {ContactTemplate, ContactUpdate} from "@clinq/bridge/dist/models";


class FreshsalesAdapter implements Adapter {
    public async handleCallEvent(config: Config, event: CallEvent): Promise<void> {
        const phoneNumber = event.direction === CallDirection.OUT ? event.to : event.from;
        const mobileNumberResponse = await searchContactByPhonenumber(config.apiKey, config.apiUrl, event,
            'mobile_number', phoneNumber);
        const comment: string = mapEvent2Comment(event);
        if (mobileNumberResponse) {
            await createCallLog(config.apiKey, config.apiUrl, event, mobileNumberResponse.id, comment)
            return
        }
        const workNumberResponse = await searchContactByPhonenumber(config.apiKey, config.apiUrl, event,
            'work_number', phoneNumber);
        if (workNumberResponse) {
            await createCallLog(config.apiKey, config.apiUrl, event, workNumberResponse.id, comment)
            return
        }
        warnLogger(config.apiKey, `Cannot find contact for phone number:`, phoneNumber);
        return
    }

    public async getContacts(config: Config): Promise<Contact[]> {
        infoLogger(config.apiKey, `getContacts triggered`);
        const viewId: number = await getAllContactsViewID(config.apiKey, config.apiUrl);
        const allContacts = await getAllContacts(config.apiKey, config.apiUrl, viewId)
        const clinqContacts: Contact[] = allContacts.map(freshSaleContact => mapFreshsalesContact2ClinqContact(freshSaleContact, config.apiUrl));
        return clinqContacts;
    }

    public async createContact(config: Config, contact: ContactTemplate): Promise<Contact> {
        try {
            let salesAccountId = contact.organization?await searchSalesAccountId(config.apiKey, config.apiUrl,contact.organization):null;
            if (contact.organization && !salesAccountId) {
                salesAccountId = await createSalesAccount(config.apiKey, config.apiUrl, contact.organization)
            }
            const freshSalesContact = mapClinqContactTemplate2FreshsaleContact(contact, salesAccountId);
            const response = await createFreshsaleContact(config.apiKey, config.apiUrl, freshSalesContact)
            const clinqContact = mapFreshsalesContact2ClinqContact(response, config.apiUrl);
            infoLogger(config.apiKey, `Created new contact ${clinqContact.id}`);
            return clinqContact
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not create: ${responseMessage}`);
            throw new ServerError(500, "Could not create contact");
        }
    }

    public async updateContact(config: Config, id: string, contact: ContactUpdate): Promise<Contact>{
        try {
            let salesAccountId = contact.organization?await searchSalesAccountId(config.apiKey, config.apiUrl,contact.organization):null;
            if (contact.organization && !salesAccountId) {
                salesAccountId = await createSalesAccount(config.apiKey, config.apiUrl, contact.organization)
            }
            const freshSalesContact = mapClinqContactTemplate2FreshsaleContact(contact, salesAccountId);
            const response = await updateFreshsaleContact(config.apiKey, config.apiUrl, freshSalesContact, id)
            infoLogger(config.apiKey, `Updated contact ${id}`);
            return mapFreshsalesContact2ClinqContact(response, config.apiUrl);
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not create: ${responseMessage}`);
            throw new ServerError(500, "Could not create contact");
        }
    }

    public async deleteContact(config: Config, id: string): Promise<void>{
        try {
            const response = await forgetFreshsaleContact(config.apiKey, config.apiUrl, id)
            infoLogger(config.apiKey, `Deleted (forgot) contact ${id}`);
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not create: ${responseMessage}`);
            throw new ServerError(500, "Could not create contact");
        }
    }
}

start(new FreshsalesAdapter());
