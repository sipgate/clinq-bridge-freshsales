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

export const mapEvent2Comment = (
    callEvent: CallEvent,
): string => {
    const { direction, from, to, channel } = callEvent;
    const date = moment(Number(callEvent.start));
    const duration = formatDuration(callEvent.end - callEvent.start);
    const directionInfo = direction === CallDirection.IN ? "Eingehender" : "Ausgehender";
    return `${directionInfo} CLINQ Anruf in channel ${channel.name} am ${date.format("DD.MM.YYYY")} (${duration})`;
};

function formatDuration(ms: number): string {
    const duration = moment.duration(ms);
    const minutes = Math.floor(duration.asMinutes());
    const seconds = duration.seconds() < 10 ? `0${duration.seconds()}` : duration.seconds();
    return `${minutes}:${seconds} min`;
}
