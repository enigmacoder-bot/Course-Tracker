import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CourseContext = createContext();

export const useCourse = () => {
    const context = useContext(CourseContext);
    if (!context) {
        throw new Error('useCourse must be used within a CourseProvider');
    }
    return context;
};

export const CourseProvider = ({ children }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    // Save courses whenever they change
    useEffect(() => {
        if (!loading) {
            saveCourses();
        }
    }, [courses]);

    const loadCourses = async () => {
        try {
            const storedCourses = await AsyncStorage.getItem('courses');
            if (storedCourses) {
                setCourses(JSON.parse(storedCourses));
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCourses = async () => {
        try {
            await AsyncStorage.setItem('courses', JSON.stringify(courses));
        } catch (error) {
            console.error('Error saving courses:', error);
        }
    };

    const addCourse = (newCourse) => {
        setCourses(prev => {
            // Avoid duplicates
            if (prev.some(c => c.id === newCourse.id)) {
                return prev;
            }
            return [...prev, newCourse];
        });
    };

    const updateCourse = (courseId, updates) => {
        setCourses(prev => prev.map(course =>
            course.id === courseId ? { ...course, ...updates } : course
        ));
    };

    const deleteCourse = (courseId) => {
        setCourses(prev => prev.filter(course => course.id !== courseId));
    };

    const updateVideoProgress = (courseId, videoId, completed) => {
        setCourses(prev => prev.map(course => {
            if (course.id !== courseId) return course;

            // Helper to update video list (root or section)
            const updateVideoList = (videos) => videos.map(v =>
                v.id === videoId ? { ...v, completed } : v
            );

            const updatedRootVideos = updateVideoList(course.rootVideos || []);
            const updatedSections = (course.sections || []).map(section => ({
                ...section,
                videos: updateVideoList(section.videos)
            }));

            // Also update the flat list for backward compatibility if needed, 
            // though we should rely on sections/rootVideos for source of truth
            const updatedVideos = updateVideoList(course.videos || []);

            // Recalculate progress
            const allVideos = updatedVideos.length > 0 ? updatedVideos : [
                ...updatedRootVideos,
                ...updatedSections.flatMap(s => s.videos)
            ];

            const completedCount = allVideos.filter(v => v.completed).length;
            const progress = allVideos.length > 0
                ? Math.round((completedCount / allVideos.length) * 100)
                : 0;

            return {
                ...course,
                rootVideos: updatedRootVideos,
                sections: updatedSections,
                videos: updatedVideos,
                progress
            };
        }));
    };

    /**
     * Update a section with its loaded videos (for lazy loading)
     * Called when user expands a section and videos are loaded
     */
    const updateSectionVideos = (courseId, sectionId, videos) => {
        setCourses(prev => prev.map(course => {
            if (course.id !== courseId) return course;

            const updatedSections = (course.sections || []).map(section => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    videos,
                    loaded: true,
                };
            });

            // Update flat videos list and recalculate totals
            const allVideos = [
                ...(course.rootVideos || []),
                ...updatedSections.flatMap(s => s.videos)
            ];

            const completedCount = allVideos.filter(v => v.completed).length;
            const progress = allVideos.length > 0
                ? Math.round((completedCount / allVideos.length) * 100)
                : 0;

            return {
                ...course,
                sections: updatedSections,
                videos: allVideos,
                videoCount: allVideos.length,
                progress,
            };
        }));
    };

    return (
        <CourseContext.Provider value={{
            courses,
            loading,
            addCourse,
            updateCourse,
            deleteCourse,
            updateVideoProgress,
            updateSectionVideos
        }}>
            {children}
        </CourseContext.Provider>
    );
};
