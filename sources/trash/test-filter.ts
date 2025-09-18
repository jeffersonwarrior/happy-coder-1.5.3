import { parseMarkdown } from '../components/markdown/parseMarkdown';

const testMarkdown = `
This is normal text that should appear.

<system-reminder>
This is a system reminder that should be filtered out.
Multiple lines of system content.
</system-reminder>

More normal text here.

<options>
<option>Keep this option</option>
<option>And this one too</option>
</options>

<function_calls>
<invoke name="some_tool">
<parameter name="test">value