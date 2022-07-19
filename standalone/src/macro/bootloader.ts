import { isNullOrEmpty } from '@collabsoft-net/helpers';

const windowWithAP = window as unknown as Window & { AP: AP.Instance };
const dialogStyleFix = 'margin: 0px !important;';

export const createPlaceholder = async (): Promise<void> => {
  const AP = await waitForAP();

  const connect = isValidConnectRequest();
  if (connect) {
    const placeholder = document.createElement('div');
    placeholder.setAttribute('id', connect.moduleId);
    placeholder.setAttribute('class', 'ac-content');
    document.body.prepend(placeholder);

    // For some reason, Atlassian overrides the margin on the body element
    // When in a dialog, it adds 10px. Let's undo this in order to keep control
    // https://bitbucket.org/atlassian/atlassian-connect-js/src/1ee59cbf2ea51ca74e2ab0e7c713d9a955692cdf/src/plugin/index.js?at=master#lines-39

    const options = AP && AP._data && AP._data.options as Record<string, unknown>;
    if (options && options.isDialog) {
      new MutationObserver(() => {
        if (document.body.getAttribute('style') !== dialogStyleFix) {
          document.body.setAttribute('style', dialogStyleFix);
        }
      }).observe(document.body, { attributes: true });
      document.body.setAttribute('style', dialogStyleFix);
      placeholder.setAttribute('style', 'height: 100%;');
    }
  }
};
export const waitForAP = async (): Promise<AP.Instance> => {
  let count = 0;
  while (!windowWithAP.AP || count > 10) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    count++;
  }
  if (!windowWithAP.AP) {
    throw new Error('Atlassian Javascript API (AP) is not available, please verify if you have added a reference to `all.js`');
  }
  return windowWithAP.AP;
};

const isValidConnectRequest = (): ConnectParameters|null => {
  if (window && document && document.head) {
    const url = new URL(window.location.href);
    const moduleId = url.searchParams.get('s');

    if (!isNullOrEmpty(moduleId)) {
      return { moduleId: moduleId as string };
    }
  }
  return null;
};

// Fix for incorrect iframe sizing
export const resizeFix = async (): Promise<void> => {
  const AP = await waitForAP();
  const refElement = document.querySelector('.ac-content') || document.body;

  if (AP && AP.resize) {
    let scrollHeight = 0;

    const onResize = () => {
      if (scrollHeight !== refElement.scrollHeight) {
        scrollHeight = refElement.scrollHeight;
        AP.resize('100%', scrollHeight.toString() + 'px');
      }
    };

    new MutationObserver(onResize).observe(refElement, {
      attributes: true,
      childList: true,
      subtree: true
    });

    onResize();
  }
};

interface ConnectParameters {
  moduleId: string;
}
