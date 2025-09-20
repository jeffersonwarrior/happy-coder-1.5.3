import * as React from 'react';
import { ToolDiffView } from '@/components/tools/ToolDiffView';
import { useSetting } from '@/sync/storage';
import { trimIdent } from '@/utils/trimIdent';
import { knownTools } from '../../tools/knownTools';
import { ToolSectionView } from '../../tools/ToolSectionView';
import { ToolViewProps } from './_all';

export const EditView = React.memo<ToolViewProps>(({ tool }) => {
  const showLineNumbersInToolViews = useSetting('showLineNumbersInToolViews');

  let oldString = '';
  let newString = '';
  const parsed = knownTools.Edit.input.safeParse(tool.input);
  if (parsed.success) {
    oldString = trimIdent(parsed.data.old_string || '');
    newString = trimIdent(parsed.data.new_string || '');
  }

  return (
    <>
      <ToolSectionView fullWidth>
        <ToolDiffView
          oldText={oldString}
          newText={newString}
          showLineNumbers={showLineNumbersInToolViews}
          showPlusMinusSymbols={showLineNumbersInToolViews}
        />
      </ToolSectionView>
    </>
  );
});
