export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      tabUntil: typeof tabUntil;
      focusBody: typeof focusBody;
      enableAccessibility: typeof enableAccessibility;
      disableAccessibility: typeof disableAccessibility;
    }
  }
}

async function fireCdpCommand<T = Record<string, unknown>>(
  command: string,
  params: Record<string, unknown>
): Promise<T> {
  return Cypress.automation('remote:debugger:protocol', {
    command,
    params,
  }).catch((e) => {
    throw new Error(`Error evaluating command ${command}: ${e}`);
  });
}

function tab(backwards: boolean) {
  return fireCdpCommand('Input.dispatchKeyEvent', {
    modifiers: backwards ? 8 : 0, // shift pressed, go backwards
    type: 'keyDown',

    keyCode: 9,
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
}

async function activeElement(): Promise<{
  backendNodeId: number;
  objectId: string;
}> {
  const element = await fireCdpCommand<{
    result: { objectId: string };
  }>('Runtime.evaluate', {
    expression: `document.activeElement.nodeName === 'IFRAME' ? document.activeElement.contentDocument.activeElement : document.activeElement`,
  });

  const described = await fireCdpCommand<{ node: { backendNodeId: number } }>(
    'DOM.describeNode',
    {
      objectId: element.result?.objectId,
    }
  );

  return {
    backendNodeId: described.node.backendNodeId,
    objectId: element.result.objectId,
  };
}

interface TabUntilOptions {
  accessibleTextIs: string;
  maxPresses?: number;
  direction?: 'forward' | 'backwards';
}

const defaultMaxPresses = 50;
async function tabUntil({
  accessibleTextIs,
  maxPresses,
  direction,
}: TabUntilOptions) {
  const backwards = direction === 'backwards';
  const max = maxPresses && maxPresses > 0 ? maxPresses : defaultMaxPresses;

  const startingElement = await activeElement();

  const seenElements: Set<number> = new Set<number>();
  seenElements.add(startingElement.backendNodeId);
  console.log(startingElement.backendNodeId, 'starting');

  await tab(backwards);

  for (let i = 0; i < max; i++) {
    const current: any = await activeElement();
    const axTree: any = await fireCdpCommand('Accessibility.getPartialAXTree', {
      objectId: current.objectId,
    });

    // The accessible text of a node is held within the .nodes[].name.value fields
    const match = (axTree.nodes || []).filter(
      (axNode: any) => axNode?.name?.value === accessibleTextIs
    );

    if (match.length > 0) {
      return;
    }

    // Check if we've gone in a circle
    if (seenElements.has(current.backendNodeId)) {
      throw new Error(
        `tabUntil has tabbed into a loop without seeing accessible text "${accessibleTextIs}"`
      );
    }
    seenElements.add(current.backendNodeId);
    console.log(current.backendNodeId);

    tab(backwards);
  }

  throw new Error(
    `tabUntil could not find an element within ${max} tab presses that has the accessible text "${accessibleTextIs}"`
  );
}

function focusBody() {
  return fireCdpCommand('Runtime.evaluate', {
    expression: `document.querySelector('.aut-iframe').focus()`,
  });
}

function enableAccessibility() {
  return fireCdpCommand('Accessibility.enable', {});
}

function disableAccessibility() {
  return fireCdpCommand('Accessibility.disable', {});
}

Cypress.Commands.add('focusBody', focusBody);
Cypress.Commands.add('tabUntil', tabUntil);
Cypress.Commands.add('enableAccessibility', enableAccessibility);
Cypress.Commands.add('disableAccessibility', disableAccessibility);
