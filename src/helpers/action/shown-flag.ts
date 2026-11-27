import { isEmpty, isString } from 'lodash-es';

/** `flag` where `content` is a non-empty string, `false` where it is not: whether a label or an icon is shown. */
export function shownFlag(content: unknown, flag: boolean | undefined): boolean | undefined {
  return isString(content) && !isEmpty(content) ? flag : false;
}
