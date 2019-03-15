import * as React from "react";
import { StyleSheet, ViewStyle, View, Dimensions, PanResponderInstance, PanResponder, Animated, ImageBackground, ImageStyle } from "react-native";

const deviceWidth = Dimensions.get("screen").width;
const deviceHeight = Dimensions.get("screen").height;

export class ImageEditor extends React.PureComponent {
	dragPanResponder: PanResponderInstance;

	positionAnimation: Animated.ValueXY;
	resizeAnimation: Animated.ValueXY;

	topDragPanResponder: PanResponderInstance;
	rightDragPanResponder: PanResponderInstance;
	bottomDragPanResponder: PanResponderInstance;
	leftDragPanResponder: PanResponderInstance;

	componentWillMount = () => {
		this.positionAnimation = new Animated.ValueXY({
			x: deviceWidth / 2 - 100,
			y: deviceHeight / 2 - 100
		});

		this.resizeAnimation = new Animated.ValueXY({
			x: 200,
			y: 200
		});

		this.topDragPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (event, gesture) => {
				this.positionAnimation.extractOffset();
				this.resizeAnimation.extractOffset();
			},
			onPanResponderMove: (event, gesture) => {
				this.positionAnimation.setValue({ x: gesture.dx, y: gesture.dy });
				this.resizeAnimation.setValue({ x: gesture.dx * -1, y: gesture.dy * -1 });
			}
		});

		this.rightDragPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (event, gesture) => {
				this.positionAnimation.extractOffset();
				this.resizeAnimation.extractOffset();
			},
			onPanResponderMove: (event, gesture) => {
				const { dx, dy } = gesture;
				this.positionAnimation.setValue({ x: 0, y: dy });
				this.resizeAnimation.setValue({ x: dx, y: dy * -1 });
			}
		});

		this.bottomDragPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (event, gesture) => {
				this.positionAnimation.extractOffset();
				this.resizeAnimation.extractOffset();
			},
			onPanResponderMove: (event, gesture) => {
				this.positionAnimation.setValue({ x: 0, y: 0 });
				this.resizeAnimation.setValue({ x: gesture.dx, y: gesture.dy });
			}
		});

		this.leftDragPanResponder = PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponderCapture: () => true,
			onPanResponderGrant: (event, gesture) => {
				this.positionAnimation.extractOffset();
				this.resizeAnimation.extractOffset();
			},
			onPanResponderMove: (event, gesture) => {
				this.positionAnimation.setValue({ x: gesture.dx, y: 0 });
				this.resizeAnimation.setValue({ x: gesture.dx * -1, y: gesture.dy });
			}
		});
	};

	render() {
		return (
			<ImageBackground
				style={styles.container}
				source={{ uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0rtP_je6NvLXCHpYqmJ-XNiqERYQf7ghTmyckZ1h4IMJvqJlL" }}>
				<Animated.View
					style={[
						styles.cropper,
						{
							top: this.positionAnimation.y,
							left: this.positionAnimation.x,
							height: this.resizeAnimation.y,
							width: this.resizeAnimation.x
						}
					]}>
					<Animated.View style={[styles.resizeHandle, styles.resizeHandleTop]} {...this.topDragPanResponder.panHandlers} />
					<Animated.View style={[styles.resizeHandle, styles.resizeHandleRight]} {...this.rightDragPanResponder.panHandlers} />
					<Animated.View style={[styles.resizeHandle, styles.resizeHandleBottom]} {...this.bottomDragPanResponder.panHandlers} />
					<Animated.View style={[styles.resizeHandle, styles.resizeHandleLeft]} {...this.leftDragPanResponder.panHandlers} />
				</Animated.View>
			</ImageBackground>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "red"
	} as ImageStyle,
	cropper: {
		position: "absolute",
		width: 200,
		height: 200,
		top: deviceHeight / 2 - 100,
		left: deviceWidth / 2 - 100,
		borderWidth: 2.5,
		borderStyle: "dashed",
		borderColor: "white",
		backgroundColor: "rgba(0,0,0,0.4)"
	} as ViewStyle,
	resizeHandle: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "white",
		position: "absolute",
		zIndex: 3
	} as ViewStyle,
	resizeHandleTop: {
		top: -10,
		left: -10
	} as ViewStyle,
	resizeHandleRight: {
		top: -10,
		right: -10
	} as ViewStyle,
	resizeHandleBottom: {
		bottom: -10,
		right: -10
	} as ViewStyle,
	resizeHandleLeft: {
		bottom: -10,
		left: -10
	} as ViewStyle
});
