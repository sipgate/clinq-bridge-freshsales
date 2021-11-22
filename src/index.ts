import {Adapter, Config, Contact, start, CallEvent, CallDirection, OAuthURLConfig} from "@clinq/bridge";
import {
    createCallLog,
    getAllContacts,
    getAllContactsViewID,
    searchContactByPhonenumber
} from './utils/freshsales'
import {mapEvent2Comment, mapFreshsalesContact2ClinqContact} from "./utils/mapper";
import {infoLogger, warnLogger} from "./utils/logger";


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
}

start(new FreshsalesAdapter());
