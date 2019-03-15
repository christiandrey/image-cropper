/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/emin93/react-native-template-typescript
 *
 * @format
 */

import React, { Component } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { ImageEditor } from "./ImageEditor";
import { ImageCropper } from "./ImageCropper";

const instructions = Platform.select({
	ios: "Press Cmd+R to reload,\n" + "Cmd+D or shake for dev menu",
	android: "Double tap R on your keyboard to reload,\n" + "Shake or press menu button for dev menu"
});

interface Props {}
export default class App extends Component<Props> {
	render() {
		return (
			<View style={styles.container}>
				<ImageCropper />
				{/* <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.tsx</Text>
        <Text style={styles.instructions}>{instructions}</Text> */}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5FCFF"
	}
});
