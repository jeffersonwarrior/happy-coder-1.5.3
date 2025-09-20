import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Animated, Text, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Avatar } from "@/components/Avatar";
import { CliManagement } from "@/components/CliManagement";
import { CodeView } from "@/components/CodeView";
import { Item } from "@/components/Item";
import { ItemGroup } from "@/components/ItemGroup";
import { ItemList } from "@/components/ItemList";
import { layout } from "@/components/layout";
import { Typography } from "@/constants/Typography";
import { Modal } from "@/modal";
import { sessionKill } from "@/sync/ops";
import { useSession } from "@/sync/storage";
import type { Session } from "@/sync/storageTypes";
import { t } from "@/text";
import {
	formatOSPlatform,
	formatPathRelativeToHome,
	getSessionAvatarId,
	getSessionName,
	useSessionStatus,
} from "@/utils/sessionUtils";
import { isVersionSupported, MINIMUM_CLI_VERSION } from "@/utils/versionUtils";

// Animated status dot component
function StatusDot({
	color,
	isPulsing,
	size = 8,
}: {
	color: string;
	isPulsing?: boolean;
	size?: number;
}) {
	const pulseAnim = React.useRef(new Animated.Value(1)).current;

	React.useEffect(() => {
		if (isPulsing) {
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 0.3,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
				]),
			).start();
		} else {
			pulseAnim.setValue(1);
		}
	}, [isPulsing, pulseAnim]);

	return (
		<Animated.View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: color,
				opacity: pulseAnim,
				marginRight: 4,
			}}
		/>
	);
}

export default React.memo(() => {
	const { theme } = useUnistyles();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const session = useSession(id);
	const devModeEnabled = __DEV__;

	const handleCopySessionId = useCallback(async () => {
		if (!session) return;
		try {
			await Clipboard.setStringAsync(session.id);
			Modal.alert(t("common.success"), t("sessionInfo.happySessionIdCopied"));
		} catch (error) {
			Modal.alert(t("common.error"), t("sessionInfo.failedToCopySessionId"));
		}
	}, [session]);

	const handleCopyMetadata = useCallback(async () => {
		if (!session?.metadata) return;
		try {
			await Clipboard.setStringAsync(JSON.stringify(session.metadata, null, 2));
			Modal.alert(t("common.success"), t("sessionInfo.metadataCopied"));
		} catch (error) {
			Modal.alert(t("common.error"), t("sessionInfo.failedToCopyMetadata"));
		}
	}, [session]);

	const handleArchiveSession = useCallback(async () => {
		if (!session) return;

		Modal.alert(
			t("sessionInfo.archiveSession"),
			t("sessionInfo.archiveSessionConfirm"),
			[
				{ text: t("common.cancel"), style: "cancel" },
				{
					text: t("sessionInfo.archiveSession"),
					style: "destructive",
					onPress: async () => {
						try {
							const result = await sessionKill(session.id);
							if (result.success) {
								router.back();
								router.back();
							} else {
								Modal.alert(
									t("common.error"),
									result.message || t("sessionInfo.failedToArchiveSession"),
								);
							}
						} catch (error) {
							Modal.alert(
								t("common.error"),
								error instanceof Error
									? error.message
									: t("sessionInfo.failedToArchiveSession"),
							);
						}
					},
				},
			],
		);
	}, [session, router]);

	const formatDate = useCallback((timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	}, []);

	const handleCopyUpdateCommand = useCallback(async () => {
		const updateCommand = "npm install -g happy-coder@latest";
		try {
			await Clipboard.setStringAsync(updateCommand);
			Modal.alert(t("common.success"), updateCommand);
		} catch (error) {
			Modal.alert(t("common.error"), t("common.error"));
		}
	}, []);

	// Always call hooks before any conditional returns
	const sessionStatus = useSessionStatus(session || ({} as Session));
	const sessionName = getSessionName(session || ({} as Session));

	if (!session) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<Text
					style={{
						color: theme.colors.textSecondary,
						fontSize: 17,
						...Typography.default("semiBold"),
					}}
				>
					{t("errors.sessionNotFound")}
				</Text>
			</View>
		);
	}
	// Check if CLI version is outdated
	const isCliOutdated =
		session.metadata?.version &&
		!isVersionSupported(session.metadata.version, MINIMUM_CLI_VERSION);

	return (
		<>
			<ItemList>
				{/* Session Header */}
				<View
					style={{
						maxWidth: layout.maxWidth,
						alignSelf: "center",
						width: "100%",
					}}
				>
					<View
						style={{
							alignItems: "center",
							paddingVertical: 24,
							backgroundColor: theme.colors.surface,
							marginBottom: 8,
							borderRadius: 12,
							marginHorizontal: 16,
							marginTop: 16,
						}}
					>
						<Avatar
							id={getSessionAvatarId(session)}
							size={80}
							monochrome={!sessionStatus.isConnected}
							flavor={session.metadata?.flavor}
						/>
						<Text
							style={{
								fontSize: 20,
								fontWeight: "600",
								marginTop: 12,
								textAlign: "center",
								color: theme.colors.text,
								...Typography.default("semiBold"),
							}}
						>
							{sessionName}
						</Text>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginTop: 8,
							}}
						>
							<StatusDot
								color={sessionStatus.statusDotColor}
								isPulsing={sessionStatus.isPulsing}
								size={10}
							/>
							<Text
								style={{
									fontSize: 15,
									color: sessionStatus.statusColor,
									fontWeight: "500",
									...Typography.default(),
								}}
							>
								{sessionStatus.statusText}
							</Text>
						</View>
					</View>
				</View>

				{/* CLI Management Section */}
				<CliManagement session={session} />

				{/* Session Details */}
				<ItemGroup>
					<Item
						title={t("sessionInfo.happySessionId")}
						subtitle={`${session.id.substring(0, 8)}...${session.id.substring(session.id.length - 8)}`}
						icon={
							<Ionicons name="finger-print-outline" size={29} color="#007AFF" />
						}
						onPress={handleCopySessionId}
					/>
					{session.metadata?.claudeSessionId && (
						<Item
							title={t("sessionInfo.claudeCodeSessionId")}
							subtitle={`${session.metadata.claudeSessionId.substring(0, 8)}...${session.metadata.claudeSessionId.substring(session.metadata.claudeSessionId.length - 8)}`}
							icon={<Ionicons name="code-outline" size={29} color="#9C27B0" />}
							onPress={async () => {
								try {
									await Clipboard.setStringAsync(
										session.metadata!.claudeSessionId!,
									);
									Modal.alert(
										t("common.success"),
										t("sessionInfo.claudeCodeSessionIdCopied"),
									);
								} catch (error) {
									Modal.alert(
										t("common.error"),
										t("sessionInfo.failedToCopyClaudeCodeSessionId"),
									);
								}
							}}
						/>
					)}
					<Item
						title={t("sessionInfo.connectionStatus")}
						detail={
							sessionStatus.isConnected
								? t("status.online")
								: t("status.offline")
						}
						icon={
							<Ionicons
								name="pulse-outline"
								size={29}
								color={sessionStatus.isConnected ? "#34C759" : "#8E8E93"}
							/>
						}
						showChevron={false}
					/>
					<Item
						title={t("sessionInfo.created")}
						subtitle={formatDate(session.createdAt)}
						icon={
							<Ionicons name="calendar-outline" size={29} color="#007AFF" />
						}
						showChevron={false}
					/>
					<Item
						title={t("sessionInfo.lastUpdated")}
						subtitle={formatDate(session.updatedAt)}
						icon={<Ionicons name="time-outline" size={29} color="#007AFF" />}
						showChevron={false}
					/>
					<Item
						title={t("sessionInfo.sequence")}
						detail={session.seq.toString()}
						icon={
							<Ionicons name="git-commit-outline" size={29} color="#007AFF" />
						}
						showChevron={false}
					/>
				</ItemGroup>

				{/* Quick Actions */}
				<ItemGroup title={t("sessionInfo.quickActions")}>
					{session.metadata?.machineId && (
						<Item
							title={t("sessionInfo.viewMachine")}
							subtitle={t("sessionInfo.viewMachineSubtitle")}
							icon={
								<Ionicons name="server-outline" size={29} color="#007AFF" />
							}
							onPress={() =>
								router.push(`/machine/${session.metadata?.machineId}`)
							}
						/>
					)}
					{sessionStatus.isConnected && (
						<Item
							title={t("sessionInfo.archiveSession")}
							subtitle={t("sessionInfo.archiveSessionSubtitle")}
							icon={
								<Ionicons name="archive-outline" size={29} color="#FF3B30" />
							}
							onPress={handleArchiveSession}
						/>
					)}
				</ItemGroup>

				{/* Metadata */}
				{session.metadata && (
					<ItemGroup title={t("sessionInfo.metadata")}>
						<Item
							title={t("sessionInfo.host")}
							subtitle={session.metadata.host}
							icon={
								<Ionicons name="desktop-outline" size={29} color="#5856D6" />
							}
							showChevron={false}
						/>
						<Item
							title={t("sessionInfo.path")}
							subtitle={formatPathRelativeToHome(
								session.metadata.path,
								session.metadata.homeDir,
							)}
							icon={
								<Ionicons name="folder-outline" size={29} color="#5856D6" />
							}
							showChevron={false}
						/>
						{session.metadata.version && (
							<Item
								title={t("sessionInfo.cliVersion")}
								subtitle={session.metadata.version}
								detail={isCliOutdated ? "⚠️" : undefined}
								icon={
									<Ionicons
										name="git-branch-outline"
										size={29}
										color={isCliOutdated ? "#FF9500" : "#5856D6"}
									/>
								}
								showChevron={false}
							/>
						)}
						{session.metadata.os && (
							<Item
								title={t("sessionInfo.operatingSystem")}
								subtitle={formatOSPlatform(session.metadata.os)}
								icon={
									<Ionicons
										name="hardware-chip-outline"
										size={29}
										color="#5856D6"
									/>
								}
								showChevron={false}
							/>
						)}
						<Item
							title={t("sessionInfo.aiProvider")}
							subtitle={(() => {
								const flavor = session.metadata.flavor || "claude";
								if (flavor === "claude") return "Claude";
								if (flavor === "gpt" || flavor === "openai") return "Codex";
								if (flavor === "gemini") return "Gemini";
								return flavor;
							})()}
							icon={
								<Ionicons name="sparkles-outline" size={29} color="#5856D6" />
							}
							showChevron={false}
						/>
						{session.metadata.hostPid && (
							<Item
								title={t("sessionInfo.processId")}
								subtitle={session.metadata.hostPid.toString()}
								icon={
									<Ionicons name="terminal-outline" size={29} color="#5856D6" />
								}
								showChevron={false}
							/>
						)}
						{session.metadata.happyHomeDir && (
							<Item
								title={t("sessionInfo.happyHome")}
								subtitle={formatPathRelativeToHome(
									session.metadata.happyHomeDir,
									session.metadata.homeDir,
								)}
								icon={
									<Ionicons name="home-outline" size={29} color="#5856D6" />
								}
								showChevron={false}
							/>
						)}
						<Item
							title={t("sessionInfo.copyMetadata")}
							icon={<Ionicons name="copy-outline" size={29} color="#007AFF" />}
							onPress={handleCopyMetadata}
						/>
					</ItemGroup>
				)}

				{/* Agent State */}
				{session.agentState && (
					<ItemGroup title={t("sessionInfo.agentState")}>
						<Item
							title={t("sessionInfo.controlledByUser")}
							detail={
								session.agentState.controlledByUser
									? t("common.yes")
									: t("common.no")
							}
							icon={
								<Ionicons name="person-outline" size={29} color="#FF9500" />
							}
							showChevron={false}
						/>
						{session.agentState.requests &&
							Object.keys(session.agentState.requests).length > 0 && (
								<Item
									title={t("sessionInfo.pendingRequests")}
									detail={Object.keys(
										session.agentState.requests,
									).length.toString()}
									icon={
										<Ionicons
											name="hourglass-outline"
											size={29}
											color="#FF9500"
										/>
									}
									showChevron={false}
								/>
							)}
					</ItemGroup>
				)}

				{/* Activity */}
				<ItemGroup title={t("sessionInfo.activity")}>
					<Item
						title={t("sessionInfo.thinking")}
						detail={session.thinking ? t("common.yes") : t("common.no")}
						icon={
							<Ionicons
								name="bulb-outline"
								size={29}
								color={session.thinking ? "#FFCC00" : "#8E8E93"}
							/>
						}
						showChevron={false}
					/>
					{session.thinking && (
						<Item
							title={t("sessionInfo.thinkingSince")}
							subtitle={formatDate(session.thinkingAt)}
							icon={<Ionicons name="timer-outline" size={29} color="#FFCC00" />}
							showChevron={false}
						/>
					)}
				</ItemGroup>

				{/* Raw JSON (Dev Mode Only) */}
				{devModeEnabled && (
					<ItemGroup title="Raw JSON (Dev Mode)">
						{session.agentState && (
							<>
								<Item
									title="Agent State"
									icon={
										<Ionicons
											name="code-working-outline"
											size={29}
											color="#FF9500"
										/>
									}
									showChevron={false}
								/>
								<View style={{ marginHorizontal: 16, marginBottom: 12 }}>
									<CodeView
										code={JSON.stringify(session.agentState, null, 2)}
										language="json"
									/>
								</View>
							</>
						)}
						{session.metadata && (
							<>
								<Item
									title="Metadata"
									icon={
										<Ionicons
											name="information-circle-outline"
											size={29}
											color="#5856D6"
										/>
									}
									showChevron={false}
								/>
								<View style={{ marginHorizontal: 16, marginBottom: 12 }}>
									<CodeView
										code={JSON.stringify(session.metadata, null, 2)}
										language="json"
									/>
								</View>
							</>
						)}
						{sessionStatus && (
							<>
								<Item
									title="Session Status"
									icon={
										<Ionicons
											name="analytics-outline"
											size={29}
											color="#007AFF"
										/>
									}
									showChevron={false}
								/>
								<View style={{ marginHorizontal: 16, marginBottom: 12 }}>
									<CodeView
										code={JSON.stringify(
											{
												isConnected: sessionStatus.isConnected,
												statusText: sessionStatus.statusText,
												statusColor: sessionStatus.statusColor,
												statusDotColor: sessionStatus.statusDotColor,
												isPulsing: sessionStatus.isPulsing,
											},
											null,
											2,
										)}
										language="json"
									/>
								</View>
							</>
						)}
						{/* Full Session Object */}
						<Item
							title="Full Session Object"
							icon={
								<Ionicons
									name="document-text-outline"
									size={29}
									color="#34C759"
								/>
							}
							showChevron={false}
						/>
						<View style={{ marginHorizontal: 16, marginBottom: 12 }}>
							<CodeView
								code={JSON.stringify(session, null, 2)}
								language="json"
							/>
						</View>
					</ItemGroup>
				)}
			</ItemList>
		</>
	);
});
