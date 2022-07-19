
export const createPlaceholder = async (): Promise<void> => {
  const request = isValidRequest();

  if (request) {
    const placeholder = document.createElement('div');
    placeholder.setAttribute('id', request.moduleId);
    document.body.prepend(placeholder);
  }
};

const isValidRequest = (): { moduleId: string }|null => {
  if (window && document && document.head) {
    const url = new URL(window.location.href);
    const moduleId = url.searchParams.get('s');
    return { moduleId: moduleId as string || 'Overview' };
  }
  return null;
};
