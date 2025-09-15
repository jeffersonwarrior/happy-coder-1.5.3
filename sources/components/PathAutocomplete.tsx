import * as React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { searchFiles, FileItem } from '@/sync/suggestionFile';

interface PathAutocompleteSuggestionProps {
    item: FileItem;
}

export const PathAutocompleteSuggestion = React.memo((props: PathAutocompleteSuggestionProps) => {
    const { theme } = useUnistyles();
    const { item } = props;

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                minHeight: 44,
            }}
        >
            <Ionicons
                name={item.fileType === 'folder' ? 'folder-outline' : 'document-outline'}
                size={18}
                color={item.fileType === 'folder' ? theme.colors.button.primary.background : theme.colors.textSecondary}
                style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 15,
                        color: theme.colors.text,
                        fontWeight: '500',
                        ...Typography.default('semiBold'),
                    }}
                    numberOfLines={1}
                >
                    {item.fileName}
                </Text>
                {item.filePath && (
                    <Text
                        style={{
                            fontSize: 13,
                            color: theme.colors.textSecondary,
                            marginTop: 2,
                            ...Typography.default(),
                        }}
                        numberOfLines={1}
                    >
                        {item.filePath}
                    </Text>
                )}
            </View>
        </View>
    );
});

export interface PathAutocompleteSuggestion {
    key: string;
    text: string;
    component: React.ComponentType;
}

export async function getPathAutocompleteSuggestions(
    sessionId: string,
    query: string
): Promise<PathAutocompleteSuggestion[]> {
    if (!query || query.length === 0) {
        return [];
    }

    try {
        // Search for files and folders that match the query
        const files = await searchFiles(sessionId, query, { limit: 8 });

        // Convert FileItem to suggestion format, prioritizing folders
        return files.map((file: FileItem) => ({
            key: `path-${file.fullPath}`,
            text: file.fullPath,
            component: () => React.createElement(PathAutocompleteSuggestion, { item: file })
        }));
    } catch (error) {
        console.error('Error fetching path suggestions:', error);
        return [];
    }
}