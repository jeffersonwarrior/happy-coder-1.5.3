import * as React from 'react';
import { View } from 'react-native';
import { MultiTextInput, MultiTextInputHandle } from './MultiTextInput';
import { useActiveWord } from './autocomplete/useActiveWord';
import { useActiveSuggestions } from './autocomplete/useActiveSuggestions';
import { AgentInputAutocomplete } from './AgentInputAutocomplete';
import { applySuggestion } from './autocomplete/applySuggestion';
import { getPathAutocompleteSuggestions } from './PathAutocomplete';

interface PathTextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    sessionId?: string;
    maxHeight?: number;
    paddingTop?: number;
    paddingBottom?: number;
}

export const PathTextInput = React.forwardRef<MultiTextInputHandle, PathTextInputProps>((props, ref) => {
    const {
        value,
        onChangeText,
        placeholder = "Enter path...",
        sessionId,
        maxHeight,
        paddingTop,
        paddingBottom
    } = props;

    const [textState, setTextState] = React.useState(() => ({
        text: value,
        selection: { start: value.length, end: value.length }
    }));

    // Update text state when value prop changes
    React.useEffect(() => {
        if (value !== textState.text) {
            setTextState(prev => ({
                text: value,
                selection: prev.selection
            }));
        }
    }, [value, textState.text]);

    // Active word detection for autocomplete - for paths, we don't use prefixes
    const activeWord = useActiveWord(textState.text, textState.selection, []);

    // Active suggestions based on the current word
    const [suggestions] = useActiveSuggestions(
        activeWord,
        async (query: string) => {
            // Always provide suggestions for path input, regardless of prefix
            return await getPathAutocompleteSuggestions(sessionId || 'unknown', query);
        }
    );

    const handleTextChange = React.useCallback((newText: string) => {
        setTextState(prev => ({
            text: newText,
            selection: { start: newText.length, end: newText.length }
        }));
        onChangeText(newText);
    }, [onChangeText]);

    const handleSelectionChange = React.useCallback((selection: { start: number; end: number }) => {
        setTextState(prev => ({
            ...prev,
            selection
        }));
    }, []);

    const handleSuggestionSelect = React.useCallback((index: number) => {
        if (index >= 0 && index < suggestions.length) {
            const suggestion = suggestions[index];
            const result = applySuggestion(textState.text, textState.selection, suggestion.text, [], false);
            const newState = {
                text: result.text,
                selection: { start: result.cursorPosition, end: result.cursorPosition }
            };
            setTextState(newState);
            onChangeText(newState.text);
        }
    }, [suggestions, textState, onChangeText]);

    return (
        <View style={{ position: 'relative' }}>
            <MultiTextInput
                ref={ref}
                value={textState.text}
                onChangeText={handleTextChange}
                onSelectionChange={handleSelectionChange}
                placeholder={placeholder}
                maxHeight={maxHeight}
                paddingTop={paddingTop}
                paddingBottom={paddingBottom}
            />
            {suggestions.length > 0 && (
                <AgentInputAutocomplete
                    suggestions={suggestions.map(s => React.createElement(s.component))}
                    selectedIndex={-1}
                    onSelect={handleSuggestionSelect}
                    itemHeight={60}
                />
            )}
        </View>
    );
});

PathTextInput.displayName = 'PathTextInput';