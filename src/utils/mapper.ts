import {CallDirection, CallEvent, Contact, PhoneNumber, PhoneNumberLabel} from "@clinq/bridge";
import * as moment from "moment";
import {sanitizePhonenumber} from "./phone-numbers";

export const mapFreshsalesContact2ClinqContact = (freshsalesContact: any, apiUrl: string) => {
    const phoneNumbers: PhoneNumber[] = [];
    // vincere primary number -> clinq work number
    if (freshsalesContact.work_number) {
        phoneNumbers.push({
            label: PhoneNumberLabel.WORK,
            phoneNumber: sanitizePhonenumber(freshsalesContact.work_number),
        });
    }
    // vincere mobile number -> clinq mobile number
    if (freshsalesContact.mobile_number) {
        phoneNumbers.push({
            label: PhoneNumberLabel.MOBILE,
            phoneNumber: sanitizePhonenumber(freshsalesContact.mobile_number),
        });
    }
    const contactUrl = (new URL(apiUrl)).origin + '/crm/sales/contacts/' + freshsalesContact.id.toString();
    const primaryOrganization = freshsalesContact.sales_accounts.filter((entry: any) => entry.is_primary)
    const contact: Contact = {
        id: freshsalesContact.id,
        email: freshsalesContact.email,
        name: freshsalesContact.display_name,
        firstName: freshsalesContact.first_name,
        lastName: freshsalesContact.last_name,
        organization: primaryOrganization.length > 0 ? primaryOrganization[0].name : null,
        contactUrl: contactUrl,
        avatarUrl: freshsalesContact.avatar,
        phoneNumbers,
    };
    return contact;
};


export const mapCallEventToDescription = (callEvent: CallEvent) => {
    let description: string = "";
    // successfully connected
    if (callEvent.start && callEvent.end && callEvent.start !== callEvent.end) {
        if (callEvent.direction === CallDirection.IN) {
            description += `Called me on ${callEvent.to} from ${callEvent.from}`;
        } else {
            description += `I called him/her on ${callEvent.to} from ${callEvent.from}`;
        }
        description += ` from ${(moment.utc(new Date(callEvent.start))).local().format('YYYY-MM-DD HH:mm:ss')}`;
        description += ` to ${(moment.utc(new Date(callEvent.end))).local().format('YYYY-MM-DD HH:mm:ss')}`;
    }
    // missed call
    else {
        if (callEvent.direction === CallDirection.IN) {
            description += `Tried to called me from ${callEvent.from} on ${callEvent.to}`;
        } else {
            description += `I tried to call him/her on ${callEvent.to} from ${callEvent.from}`;
        }
    }
    return description;
}
