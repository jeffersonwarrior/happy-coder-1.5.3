import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useSettingMutable, useLocalSettingMutable } from '@/sync/storage';
import { Switch } from '@/components/Switch';
import { MultiTextInput } from '@/components/MultiTextInput';
import { t } from '@/text';

export default function FeaturesSettingsScreen() {
    const [experiments, setExperiments] = useSettingMutable('experiments');
    const [commandPaletteEnabled, setCommandPaletteEnabled] = useLocalSettingMutable('commandPaletteEnabled');
    const [markdownCopyV2, setMarkdownCopyV2] = useLocalSettingMutable('markdownCopyV2');
    const [disableCopyrightAttribution, setDisableCopyrightAttribution] = useSettingMutable('disableCopyrightAttribution');
    const [elevenLabsApiKey, setElevenLabsApiKey] = useSettingMutable('elevenLabsApiKey');
    const [elevenLabsAgentId, setElevenLabsAgentId] = useSettingMutable('elevenLabsAgentId');
    
    return (
        <ItemList style={{ paddingTop: 0 }}>
            {/* Experimental Features */}
            <ItemGroup 
                title={t('settingsFeatures.experiments')}
                footer={t('settingsFeatures.experimentsDescription')}
            >
                <Item
                    title={t('settingsFeatures.experimentalFeatures')}
                    subtitle={experiments ? t('settingsFeatures.experimentalFeaturesEnabled') : t('settingsFeatures.experimentalFeaturesDisabled')}
                    icon={<Ionicons name="flask-outline" size={29} color="#5856D6" />}
                    rightElement={
                        <Switch
                            value={experiments}
                            onValueChange={setExperiments}
                        />
                    }
                    showChevron={false}
                />
                <Item
                    title={t('settingsFeatures.markdownCopyV2')}
                    subtitle={t('settingsFeatures.markdownCopyV2Subtitle')}
                    icon={<Ionicons name="text-outline" size={29} color="#34C759" />}
                    rightElement={
                        <Switch
                            value={markdownCopyV2}
                            onValueChange={setMarkdownCopyV2}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Web-only Features */}
            {Platform.OS === 'web' && (
                <ItemGroup 
                    title={t('settingsFeatures.webFeatures')}
                    footer={t('settingsFeatures.webFeaturesDescription')}
                >
                    <Item
                        title={t('settingsFeatures.commandPalette')}
                        subtitle={commandPaletteEnabled ? t('settingsFeatures.commandPaletteEnabled') : t('settingsFeatures.commandPaletteDisabled')}
                        icon={<Ionicons name="keypad-outline" size={29} color="#007AFF" />}
                        rightElement={
                            <Switch
                                value={commandPaletteEnabled}
                                onValueChange={setCommandPaletteEnabled}
                            />
                        }
                        showChevron={false}
                    />
                </ItemGroup>
            )}

            {/* Git Features */}
            <ItemGroup
                title={t('settingsFeatures.gitFeatures')}
                footer={t('settingsFeatures.gitFeaturesDescription')}
            >
                <Item
                    title={t('settingsFeatures.disableCopyrightAttribution')}
                    subtitle={t('settingsFeatures.disableCopyrightAttributionSubtitle')}
                    icon={<Ionicons name="git-commit-outline" size={29} color="#FF6B35" />}
                    rightElement={
                        <Switch
                            value={disableCopyrightAttribution}
                            onValueChange={setDisableCopyrightAttribution}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Voice Features */}
            <ItemGroup
                title={t('settingsFeatures.voiceFeatures')}
                footer={t('settingsFeatures.voiceFeaturesDescription')}
            >
                <Item
                    title={t('settingsFeatures.elevenLabsApiKey')}
                    subtitle={t('settingsFeatures.elevenLabsApiKeySubtitle')}
                    icon={<Ionicons name="key-outline" size={29} color="#FF9500" />}
                    rightElement={
                        <MultiTextInput
                            value={elevenLabsApiKey || ''}
                            onChangeText={setElevenLabsApiKey}
                            placeholder={t('settingsFeatures.elevenLabsApiKeyPlaceholder')}
                        />
                    }
                    showChevron={false}
                />
                <Item
                    title={t('settingsFeatures.elevenLabsAgentId')}
                    subtitle={t('settingsFeatures.elevenLabsAgentIdSubtitle')}
                    icon={<Ionicons name="person-outline" size={29} color="#FF9500" />}
                    rightElement={
                        <MultiTextInput
                            value={elevenLabsAgentId || ''}
                            onChangeText={setElevenLabsAgentId}
                            placeholder={t('settingsFeatures.elevenLabsAgentIdPlaceholder')}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>
        </ItemList>
    );
}