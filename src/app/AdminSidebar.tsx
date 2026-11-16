import {View,Text,Image,Pressable,StyleSheet,ScrollView,ActivityIndicator,Alert,} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function AdminSidebar(){
    return(
        <View style={styles.container}>
            
            <View>
                <View style={styles.sidebarTop}>
                    {/* TOP */}
                    <Image source={require('../../assets/admin-icons/logo.png')} style={{width: 80, height: 80}}/>

                    <View>
                        <Text style={{fontSize: 25, fontWeight: 600, color: "#3ab862"}}>Study First</Text>
                        <Text style={{color: "#888"}}>Admin Dashboard</Text>
                    </View>
                </View>

                {/* BUTTONS */}
                <View style={styles.allButtons}>
                    <Pressable onPress={() => router.replace('/admin-dashboard')} style={styles.buttons}>
                        <Image source={require('../../assets/admin-icons/dashboard-icons.png')} style={{width: 50, height: 50}}/>
                        <Text style={styles.textButton}>Dashboard</Text>
                    </Pressable>

                    <Pressable style={styles.buttons}>
                        <Image  source={require('../../assets/admin-icons/users-icons.png')} style={{width: 50, height: 50}}/>
                        <Text style={styles.textButton}>Users</Text>
                    </Pressable>

                    <Pressable style={styles.buttons}>
                        <Image source={require('../../assets/admin-icons/notes1.png')} style={{width: 50, height: 50}}/>
                        <Text style={styles.textButton}>Notes</Text>
                    </Pressable>

                    <Pressable style={styles.buttons}>
                        <Image source={require('../../assets/admin-icons/groups1.png')} style={{width: 50, height: 50}}/>
                        <Text style={styles.textButton}>Groups</Text>
                    </Pressable>

                    <Pressable style={styles.buttons}>
                        <Image source={require('../../assets/admin-icons/messages1.png')} style={{width: 50, height: 50}}/>
                        <Text style={styles.textButton}>Messages</Text>
                    </Pressable>

                     <Pressable style={styles.buttons}>
                        <Image source={require('../../assets/admin-icons/settings.png')} style={{width: 50, height: 50}}/>
                        <Text style={styles.textButton}>Settings</Text>
                    </Pressable>

                    <Pressable style={styles.logoutButton} onPress={() => router.replace('/users/login')}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: 'white',
    },
    sidebarTop:{
        margin: 40,
    },
    buttons:{
        flexDirection: 'row',
        alignItems: 'center',
        height: 70,
        gap: 20,
        paddingHorizontal: 30,
    },
    allButtons:{
        gap: 10,
        marginHorizontal: 20,
        marginTop: 0,  
    },
    textButton:{
        color: '#3ab862',
        fontSize: 18,
        fontWeight: 600,
    },
    logoutButton:{
        backgroundColor: '#3ab862',
        height: 50,
        marginHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        marginTop: 15,
    },
    logoutText:{
        color: 'white',
        textAlign: 'center',
        fontSize: 20,
    }
})