import {Adapter, Config, Contact, start, CallEvent, CallDirection, OAuthURLConfig} from "@clinq/bridge";
import {getAllContacts, getAllContactsViewID} from './utils/freshsales'
import {mapFreshsalesContact2ClinqContact} from "./utils/mapper";


class FreshsalesAdapter implements Adapter {
    public async handleCallEvent(config: Config, event: CallEvent): Promise<void> {
    }

    public async getContacts(config: Config): Promise<Contact[]> {
        const viewId: number = await getAllContactsViewID(config.apiKey, config.apiUrl);
        const allContacts = await getAllContacts(config.apiKey, config.apiUrl, viewId)
        const clinqContacts: Contact[] = allContacts.map(freshSaleContact => mapFreshsalesContact2ClinqContact(freshSaleContact, config.apiUrl));
        return clinqContacts;
    }
}

start(new FreshsalesAdapter());
