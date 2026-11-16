import {View, Pressable, Text, Image, StyleSheet, Animated} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function onboarding() {
    return (
        <View style={onboardingStyle.container}>
            <View style={onboardingStyle.circleShape}/>
                <Image source={require('../../../assets/onboarding/Kapy1.png')} 
                resizeMode='contain'  
                style={{width: 400, height: 400, position: "absolute", bottom: -40, left:-85}}
                />

                {/* navigation */}
                <View style={{flexDirection: "row", justifyContent: "center", marginTop: 70, gap: 5}}>
                    <View style={{backgroundColor: "#247e41", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                    <View style={{backgroundColor: "#D9D9D9", width: 15, height: 15, borderRadius: 55}}></View>
                </View>

                {/* container 2  */}
            <View style={onboardingStyle.container2}>

                {/* Title & Desc */}
                <Text style={onboardingStyle.titleText}>Welcome to <Text style={{color: "white"}}>Study First</Text></Text>
                <Text style={onboardingStyle.descText}>Your school community, made for learning together</Text>
            </View>

                {/* Buttons */}
            <View style={onboardingStyle.allButtons}>
                <Pressable>
                    <Text style={onboardingStyle.backButton}>Back</Text>
                </Pressable>
                <Pressable>
                    <Text style={onboardingStyle.nextButton} onPress={() => router.push("/onboarding/onboarding2")}>Next</Text>
                </Pressable>
            </View>
        </View>
    )
}

const onboardingStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#3ab862",
    },
    
    pageContainer: {
        flex: 1,
        justifyContent: "center",
        alignContent: "center",
        paddingHorizontal: 25,
    },

    circleShape: {
        backgroundColor: "#FFF3E0",
        height: "30%",
        width: "100%",
        borderRadius: "50%",
        position: "absolute",
        bottom: -100,
    },
    container2: {
        flex: 1,
        alignItems: "center",
        marginTop: 140,
        marginBottom: 0,
    },
    allButtons: {
        flexDirection: 'row',
        gap: 40,
        justifyContent: "center",
        marginVertical: 50,
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

    titleText: {
        fontSize: 22,
        fontWeight: 800,
        color: "#FFFFFF",
    },

    descText: {
        color: "#FFFFFF",
        fontWeight: 400,
    }
})