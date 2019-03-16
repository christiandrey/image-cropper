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
				<ImageCropper
					imageURL="https://cdn.dribbble.com/users/94953/screenshots/3189793/cameraicons.png"
					imageHeight={600}
					imageWidth={800}
					accentColor="#a62124"
					onDoneEditing={(uri, base64) => console.log(uri, base64)}
				/>
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
