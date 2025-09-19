import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Switch } from '@/components/Switch';
import { useSettingMutable, useLocalSettingMutable } from '@/sync/storage';
import { t } from '@/text';

export default function FeaturesSettingsScreen() {
  const [experiments, setExperiments] = useSettingMutable('experiments');
  const [commandPaletteEnabled, setCommandPaletteEnabled] = useLocalSettingMutable('commandPaletteEnabled');
  const [markdownCopyV2, setMarkdownCopyV2] = useLocalSettingMutable('markdownCopyV2');
    
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
    </ItemList>
  );
}