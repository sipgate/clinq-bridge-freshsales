import {CallDirection, CallEvent, Contact, PhoneNumber, PhoneNumberLabel} from "@clinq/bridge";
import * as moment from "moment";
import {sanitizePhonenumber} from "./phone-numbers";
import {ContactTemplate, ContactUpdate} from "@clinq/bridge/dist/models";
const { v4: uuidv4 } = require('uuid');

export const mapFreshsalesContact2ClinqContact = (freshsalesContact: any, apiUrl: string) => {
    const phoneNumbers: PhoneNumber[] = [];
    const homeNumbers = freshsalesContact.phone_numbers.filter((entry:any) => entry.label==='Home')
    const otherNumbers = homeNumbers.length?freshsalesContact.phone_numbers.filter((entry:any) => entry.value!==homeNumbers[0].value):freshsalesContact.phone_numbers
    // freshsales mobile number -> clinq mobile number
    if (homeNumbers.length || otherNumbers.length) {
        phoneNumbers.push({
            label: PhoneNumberLabel.HOME,
            phoneNumber: homeNumbers.length?sanitizePhonenumber(homeNumbers[0].value):sanitizePhonenumber(otherNumbers.pop().value),
        });
    }
    // freshsales work number -> clinq work number
    if (freshsalesContact.work_number || otherNumbers.length) {
        phoneNumbers.push({
            label: PhoneNumberLabel.WORK,
            phoneNumber: freshsalesContact.work_number?sanitizePhonenumber(freshsalesContact.work_number):sanitizePhonenumber(otherNumbers.pop().value),
        });
    }
    // freshsales mobile number -> clinq mobile number
    if (freshsalesContact.mobile_number || otherNumbers.length) {
        phoneNumbers.push({
            label: PhoneNumberLabel.MOBILE,
            phoneNumber: freshsalesContact.mobile_number?sanitizePhonenumber(freshsalesContact.mobile_number):sanitizePhonenumber(otherNumbers.pop().value),
        });
    }
    const contactUrl = (new URL(apiUrl)).origin + '/crm/sales/contacts/' + freshsalesContact.id.toString();
    const primaryOrganization = freshsalesContact.sales_accounts?freshsalesContact.sales_accounts.filter((entry: any) => entry.is_primary):'';
    const contact: Contact = {
        id: freshsalesContact.id.toString(),
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

export const mapClinqContactTemplate2FreshsaleContact = (
    contactTemplate: ContactTemplate,
    salesAccountId: any
): {} => {
    let mobile_number: any = null;
    let work_number: any = null;
    contactTemplate.phoneNumbers?.forEach(function(phoneNumber:PhoneNumber) {
        if (phoneNumber.label === PhoneNumberLabel.MOBILE) {
            mobile_number = phoneNumber.phoneNumber;
        }
        if (phoneNumber.label === PhoneNumberLabel.WORK) {
            work_number = phoneNumber.phoneNumber;
        }
        if (phoneNumber.label === PhoneNumberLabel.HOME && !work_number) {
            work_number = phoneNumber.phoneNumber;
        }
    })
    if (salesAccountId) {
        return {
            'contact':
                {
                    'email': contactTemplate.email ? contactTemplate.email : `thisIsNoRealEmailAdressButEmailIsMandatory@${uuidv4()}.com`,
                    'display_name': contactTemplate.name ? contactTemplate.name : null,
                    'first_name': contactTemplate.firstName ? contactTemplate.firstName : null,
                    'last_name': contactTemplate.lastName ? contactTemplate.lastName : null,
                    'mobile_number': mobile_number,
                    'work_number': work_number,
                    'sales_accounts': [{'id': salesAccountId, 'is_primary': true}]
                }
        }
    }
    else  {
        return {
            'contact':
                {
                    'email': contactTemplate.email ? contactTemplate.email : `thisIsNoRealEmailAdressButEmailIsMandatory@${uuidv4()}.com`,
                    'display_name': contactTemplate.name ? contactTemplate.name : null,
                    'first_name': contactTemplate.firstName ? contactTemplate.firstName : null,
                    'last_name': contactTemplate.lastName ? contactTemplate.lastName : null,
                    'mobile_number': mobile_number,
                    'work_number': work_number
                }
        }
    }
};

