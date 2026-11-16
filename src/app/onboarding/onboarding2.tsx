import {View, Pressable, Text, Image, StyleSheet, Animated} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function onboarding2() {
    return (
        <View style={onboardingStyle.container}>
            <View style={onboardingStyle.circleShape}/>
            <Image source={require('../../../assets/onboarding/Kapy2.png')} 
                resizeMode='contain'  
                style={{width: 300, height: 300, position: "absolute", transform: [{rotate: '62deg'}],  top: 200, left: -50}}
                />

                {/* navigation */}
                <View style={{flexDirection: "row", justifyContent: "center", marginTop: 70, gap: 5}}>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#247e41", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                </View>

                <View style={onboardingStyle.container2}>
                    <Text style={onboardingStyle.titleText}>Share what you know</Text>
                    <Text style={onboardingStyle.descText}>Share notes and lesson with your {'\n'} classmates anytime</Text>
                </View>

               {/* Buttons */}
            <View style={onboardingStyle.allButtons}>
                <Pressable>
                    <Text style={onboardingStyle.backButton} onPress={() => router.push("/onboarding/onboarding1")}>Back</Text>
                </Pressable>
                <Pressable>
                    <Text style={onboardingStyle.nextButton} onPress={() => router.push("/onboarding/onboarding3")}>Next</Text>
                </Pressable>
            </View>
        </View>
    )
}

const onboardingStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#3ab862",
        height: "100%",
    },

    circleShape: {
        backgroundColor: "#FFF3E0",
        height: "30%",
        width: "100%",
        borderRadius: "50%",
        position: "absolute",
        bottom: -100,
    },

    allButtons: {
        flexDirection: 'row',
        gap: 40,
        justifyContent: "center",
        marginVertical: 50,
    },

    container2: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 140,
        alignItems: "flex-end",
        paddingHorizontal: 20,
    },

    titleText: {
        fontSize: 25,
        fontWeight: 800,
        color: "#FFFFFF",
    },

    descText: {
        color: "#FFFFFF",
        fontWeight: 400,
        textAlign: "right",
    },

    backButton: {
        backgroundColor: "#E3DED5",
        borderWidth: 1,
        paddingHorizontal: 45,
        borderRadius: 15,
        paddingVertical: 10,
    },

    nextButton: {
        backgroundColor: "#3ab862",
        borderWidth: 1,
        paddingHorizontal: 45,
        borderRadius: 15,
        paddingVertical: 10,
        color: "white",
    },

})