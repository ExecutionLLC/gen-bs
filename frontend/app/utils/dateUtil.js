import moment from 'moment';
const dateFormat = 'DD.MM.YYYY hh:mm';

export function formatDate(date) {
    return moment(date).format(dateFormat);
}